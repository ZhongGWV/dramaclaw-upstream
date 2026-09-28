"""A claimed intent is sent at most once locally; ambiguous network errors stay unknown."""

from __future__ import annotations

import asyncio
import hashlib
from typing import Awaitable, Callable

from .execution import execution_capability
from .execution_repository import ExecutionRepository, digest
from .writing import (
    WritingResult,
    run_bounded_writing_model,
    run_bounded_review_model,
    run_bounded_planning_model,
    run_bounded_outline_model,
    run_bounded_outline_review_model,
)

TextCall = Callable[[str, str, int], Awaitable[str | WritingResult]]


async def dispatch_writing(
    repository: ExecutionRepository,
    work_id: str,
    run_id: str,
    model_call: TextCall | None = None,
) -> dict | None:
    claimed = repository.claim(work_id, run_id)
    if claimed is None:
        return None
    token, snapshot = claimed
    with repository.store._connect() as db:
        operation = repository.operation(db, work_id, run_id)
        work = repository.store._work(db, work_id)
        pending = db.execute(
            "SELECT 1 FROM changes WHERE work_id=? AND status='pending'", (work_id,)
        ).fetchone()
    try:
        capability_version = execution_capability()["version"]
    except Exception:
        # Configuration resolution has not called the provider. Unlike a lost
        # provider response this is known-unsent, so release the reservation.
        return repository.complete(
            work_id, run_id, token, error_code="INPUT_CHANGED_BEFORE_SEND", sent=False
        )
    invalid = (
        digest(snapshot) != operation["request_hash"]
        or hashlib.sha256(snapshot["prompt"].encode("utf-8")).hexdigest()
        != snapshot["inputHash"]
        or capability_version != snapshot["capabilityVersion"]
        or work["revision"] != snapshot["workRevision"]
        or work["status"] == "completed"
        or pending
    )
    if invalid:
        return repository.complete(
            work_id, run_id, token, error_code="INPUT_CHANGED_BEFORE_SEND", sent=False
        )
    # This last check closes the common cancel-before-network window. A later
    # cancellation is intentionally treated as possibly billable, not refunded.
    with repository.store._connect() as db:
        current = repository.operation(db, work_id, run_id)
    if current["status"] != "dispatching":
        return repository.complete(
            work_id, run_id, token, error_code="CANCELLED_BEFORE_SEND", sent=False
        )
    try:
        parameters = snapshot["parameters"]
        repository.progress(work_id, run_id, token, "method.loaded", {
            "key": parameters.get("skill_key"),
            "version": parameters.get("skill_version"),
            "revision": parameters.get("skill_revision"),
            "references": [ref["path"] for ref in (snapshot.get("contextManifest", {}).get("methodBinding") or {}).get("selectedReferences", [])],
        })
        repository.progress(work_id, run_id, token, "model.started", {
            "model": parameters["model_name"],
            "stream": bool(parameters.get("stream")),
        })

        async def on_delta(text: str) -> None:
            repository.progress(work_id, run_id, token, "text.delta", {"text": text})

        call = model_call or (
            run_bounded_outline_review_model
            if snapshot.get("purpose") == "review" and snapshot["docKey"] == "outline"
            else run_bounded_outline_model
            if snapshot["parameters"].get("response_format") == {"type": "json_object"}
            else run_bounded_planning_model
            if snapshot.get("purpose") == "planning"
            else run_bounded_review_model
            if snapshot.get("purpose") == "review"
            else run_bounded_writing_model
        )
        async with asyncio.timeout(snapshot["limits"]["timeoutSeconds"]):
            args = (snapshot["prompt"], parameters["model_name"], snapshot["limits"]["maxOutputTokens"])
            if model_call is None and parameters.get("stream"):
                output = await run_bounded_writing_model(*args, on_delta=on_delta)
            else:
                output = await call(*args)
    except asyncio.CancelledError:
        repository.complete(work_id, run_id, token, error_code="DISPATCH_INTERRUPTED")
        raise
    except Exception:
        # Provider exceptions can contain URLs and credentials. Persist a safe
        # category only; do not infer 'not billed' from an HTTP or timeout error.
        return repository.complete(
            work_id, run_id, token, error_code="PROVIDER_RESULT_UNKNOWN"
        )
    if isinstance(output, WritingResult):
        return repository.complete(
            work_id, run_id, token, output=output.text, usage=output.receipt()
        )
    return repository.complete(work_id, run_id, token, output=output)

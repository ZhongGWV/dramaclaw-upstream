"""Loopback browser fixture using real Director routes/SQLite and a synthetic model.

Run directly with the repository virtualenv. It never imports machine credentials
or runs a real model. A fresh temporary project is created on every launch.
"""

from __future__ import annotations

import asyncio
import json
import tempfile
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException

from novelvideo.api.routes import director
from novelvideo.director import execution, writing
from novelvideo.director.dispatch import dispatch_writing
from novelvideo.director.models import CreateWork, DirectorPreset
from novelvideo.director.store import DirectorStore
from novelvideo.director.workflow import dispatch_planning


def app() -> FastAPI:
    store = DirectorStore(Path(tempfile.mkdtemp(prefix="director-browser-")))
    store.create_work(
        CreateWork(
            title="Synthetic browser validation",
            brief="A key opens a door. One episode, thirty seconds.",
            preset=DirectorPreset(
                mode="original", episode_count=1, duration_seconds=30
            ),
        )
    )
    # A separate synthetic completed work exercises explicit revision without
    # spending on providers or touching any user's project state.
    from novelvideo.director.quality import QualityService
    from tests.director.test_quality import reviewed_command

    completed = store.create_work(
        CreateWork(
            title="Synthetic completed revision validation",
            brief="A red key opens a box.",
            preset=DirectorPreset(
                mode="original", episode_count=2, duration_seconds=30
            ),
        )
    )
    store.put_document(
        completed["id"],
        "outline",
        "# The Last Key\n\n## Story overview\n\n"
        "- **Premise:** Two friends find a red key in an empty workshop.\n"
        "- **Conflict:** The locked box belongs to a friend who has left town.\n"
        "- **Format:** Two episodes, thirty seconds each.\n\n"
        "## Episode directory\n\n1. A key is found.\n2. A promise is kept.\n",
        0,
    )
    for ordinal in (1, 2):
        store.put_document(
            completed["id"],
            f"episode-{ordinal:03d}",
            f"# Scene {ordinal}\nAda uses a red key to open the box.",
            0,
        )
        QualityService(store).finalize(
            "synthetic-browser", reviewed_command(store, completed["id"], ordinal)
        )

    def contract():
        return {"model_name": "synthetic-no-provider", "locked": True}

    execution.director_model_contract = contract
    writing.director_model_contract = contract
    director.director_model_contract = contract

    from tests.director.test_outline_review import STORY

    outline_work = store.create_work(
        CreateWork(
            title="Synthetic outline evidence review",
            brief="Ada must lose the next project.",
            preset=DirectorPreset(mode="original", episode_count=1),
        )
    )
    store.put_document(outline_work["id"], "outline", STORY, 0)

    async def scoped(project, user, role):
        if project != "synthetic" or user != {"username": "synthetic-browser"}:
            raise HTTPException(403)
        return store

    async def model(prompt: str, _name: str, _tokens: int) -> str:
        await asyncio.sleep(3)
        if "TEST_UNKNOWN" in prompt:
            raise TimeoutError("synthetic response loss")
        if '"task": "Independent M12 review"' in prompt:
            from tests.director.test_quality import response

            return json.dumps(response(json.loads(prompt)["frozenInputs"]))
        if '"task": "Independent outline obligations and literary review"' in prompt:
            from tests.director.test_outline_review import response

            data = json.loads(prompt)
            value = response(
                {
                    "contentHash": data["subjectHash"],
                    "obligations": data["obligations"],
                    "passages": data["storyPassages"],
                }
            )
            value["checks"][-1].update(
                status="VIOLATED",
                explanation="Synthetic failure for browser verification, not a literary judgment.",
                suggestion="Inspect the grounded passage before revising.",
            )
            return json.dumps(value)
        parameters = json.loads(
            prompt.split("\nHOST_VERIFIED_METHOD_JSON:")[0].split("\n", 1)[1]
        )["parameters"]
        if parameters.get("output_contract") == "story-outline/2.2.0":
            from novelvideo.director.skills.runtime import load_package

            package = load_package("M07")
            value = json.loads(package["files"][package["manifest"].fixtures])[0][
                "value"
            ]
            root = parameters["outlineRoot"]
            episodes = root["episodes"]
            value["structureId"] = root["preset"]["structure"]
            value["totalDurationSeconds"] = (
                len(episodes) * root["preset"]["duration_seconds"]
            )
            value["segments"][0]["episodeIds"] = [ep["id"] for ep in episodes]
            value["whyWatch"] = [
                {"episodeId": ep["id"], "reason": "Synthetic action and payoff."}
                for ep in episodes
            ]
            value["hooks"][0]["episodeId"] = episodes[0]["id"]
            value["setups"][0].update(
                plantEpisodeId=episodes[0]["id"], payoffEpisodeId=episodes[-1]["id"]
            )
            return json.dumps(value)
        return "# Synthetic outline\n\nA key is found. The locked door is opened.\n\nBrowser fixture only; no provider call."

    async def dispatch(repository, work_id, run_id):
        return await dispatch_writing(repository, work_id, run_id, model)

    async def plan(repository, work_id):
        from tests.director.test_workflow import output_for

        async def planning_model(prompt, _name, _tokens):
            await asyncio.sleep(1)
            parameters = json.loads(
                prompt.split("\nHOST_VERIFIED_METHOD_JSON:")[0].split("\n", 1)[1]
            )["parameters"]
            return json.dumps(output_for((store, work_id), parameters["stage"]))

        return await dispatch_planning(repository, work_id, planning_model)

    director._store = scoped
    director.dispatch_writing = dispatch
    director.dispatch_planning = plan
    application = FastAPI()
    application.include_router(director.router, prefix="/api/v1")
    application.dependency_overrides[director.get_api_user] = lambda: {
        "username": "synthetic-browser"
    }
    return application


if __name__ == "__main__":
    uvicorn.run(app(), host="127.0.0.1", port=18780, log_level="warning")

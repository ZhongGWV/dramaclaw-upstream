// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 ClaymoreLab
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DirectorQualityReport, DirectorWork, FinalizeDirectorCommand } from '@/api/director';

export function QualityReviewDialog({ work, ordinal, report, busy, error, onClose, onReview, onConfirm }: {
  work: DirectorWork; ordinal: number; report: DirectorQualityReport; busy: boolean; error: string;
  onClose: () => void; onReview: () => void; onConfirm: (command: FinalizeDirectorCommand) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const intent = useRef<FinalizeDirectorCommand | null>(null);
  const ready = report.ready_for_human_review && report.review && report.requiredHumanChecks.every((id) => (evidence[id] ?? '').trim().length >= 10);
  const submit = async () => {
    if (!ready || !report.review || busy) return;
    if (!intent.current) {
      const id = crypto.randomUUID();
      intent.current = { schemaVersion: 2, commandId: id, clientRequestId: id, workId: work.id, episodeOrdinal: ordinal,
        expectedWorkRevision: work.revision, documentVersion: report.version, contentHash: report.contentHash,
        reportId: report.review.id, reportHash: report.review.reportHash,
        humanChecks: report.requiredHumanChecks.map((checkId) => ({ checkId, evidence: evidence[checkId].trim(),
          conclusion: ['timing', 'production_unverified'].includes(checkId) ? 'literary_only' : 'verified' })),
      };
    }
    await onConfirm(intent.current);
  };
  return <div className="dc-overlay"><div className="dc-small-modal" role="dialog" aria-modal="true" aria-label={t('director.finalizeEpisode')}>
    <h2>{t('director.finalizeEpisode')}</h2><p>{t('director.review.literaryOnly')}</p>
    <div className="dc-quality-report">
      <strong>{t('director.review.status', { status: report.review?.status ?? t('director.review.notReviewed'), version: report.version })}</strong>
      {report.blockers.map((code) => <p className="dc-quality-blocker" key={code}>{t(`director.quality.${code}`, { defaultValue: code })}</p>)}
      {report.review?.checks.map((check) => <details key={check.id} open={check.status !== 'PASS'}>
        <summary>{t(`director.review.checks.${check.id}`)} · {check.status}</summary><p>{check.validationErrorCode ? t('director.review.invalidEvidence') : check.explanation}</p>
        {check.evidence.map((item, i) => <blockquote key={i}>{item.inputId}: {item.quote}</blockquote>)}
        {check.suggestion && <p>{check.suggestion}</p>}
      </details>)}
      {report.retainedValidation && <section aria-label={t('director.review.retainedValidation')}>
        <strong>{t('director.review.retainedValidation')} · {report.retainedValidation.status}</strong>
        <p>{t('director.review.retainedValidationHint')}</p>
        {report.retainedValidation.checks.filter((check) => check.status === 'FAIL').map((check) => <details open key={check.id}>
          <summary>{t(`director.review.checks.${check.id}`)} · FAIL</summary><p>{check.explanation}</p>
          {check.evidence.map((item, index) => <blockquote key={index}>{item.inputId}: {item.quote}</blockquote>)}
          {check.suggestion && <p>{check.suggestion}</p>}
        </details>)}
      </section>}
      {report.ready_for_human_review && report.requiredHumanChecks.map((id) => <label className="dc-field-label" key={id}>
        {t(`director.review.checks.${id}`)}<textarea value={evidence[id] ?? ''} disabled={busy} minLength={10} maxLength={4000}
          placeholder={t('director.review.evidenceHint')} onChange={(event) => { intent.current = null; setEvidence({ ...evidence, [id]: event.target.value }); }} />
      </label>)}
    </div>
    {error && <p role="alert" className="dc-error">{error}</p>}
    <footer><button type="button" onClick={onClose} disabled={busy}>{t('director.cancel')}</button>
      <button type="button" onClick={onReview} disabled={busy || report.blockers.some((code) => ['ACTIVE_OPERATION', 'PENDING_CHANGES', 'NOT_CURRENT_EPISODE'].includes(code))}>{t('director.review.run')}</button>
      <button type="button" className="dc-primary-button" disabled={!ready || busy} onClick={() => void submit()}>{t('director.confirmFinalize')}</button>
    </footer>
  </div></div>;
}

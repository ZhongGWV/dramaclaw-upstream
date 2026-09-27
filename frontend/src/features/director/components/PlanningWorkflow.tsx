// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 ClaymoreLab
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';
import type { DirectorWork } from '@/api/director';
import { ApiError } from '@/api/client';
import { ChevronDown } from './DirectorReferenceIcon';
import { getPlanningState, sendPlanningCommand, type ExecutionCapability, type PlanningCommand,
  type PlanningPayload, type PlanningQuote, type PlanningState } from '@/api/director-execution';

interface Props {
  project: string; work: DirectorWork; capability: ExecutionCapability | null; maxOutputTokens: number;
  hasDocuments: boolean; onChanged: (workId: string) => void;
  onState: (phase: PlanningState['phase']) => void;
  quoteAction: MutableRefObject<(() => void) | null>;
}

export function PlanningWorkflow({ project, work, capability, maxOutputTokens, hasDocuments, onChanged, onState, quoteAction }: Props) {
  const { t } = useTranslation();
  const [state, setState] = useState<PlanningState | null>(null);
  const [quote, setQuote] = useState<PlanningQuote | null>(null);
  const [consent, setConsent] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [freeText, setFreeText] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef<PlanningCommand | null>(null);
  const alive = useRef(true);
  const onStateRef = useRef(onState);
  onStateRef.current = onState;

  useEffect(() => {
    alive.current = true;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const next = await getPlanningState(project, work.id);
        if (!active) return;
        setState(next); onStateRef.current(next.phase);
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : String(reason));
      } finally {
        if (active) timer = setTimeout(() => void poll(), 2500);
      }
    };
    void poll();
    return () => { active = false; alive.current = false; if (timer) clearTimeout(timer); };
  }, [project, work.id]);

  const perform = useCallback(async (payload?: PlanningPayload) => {
    if (busy || !state || !capability) return;
    // A lost HTTP response must retry the exact intent, even if polling has
    // since brought in a newer server revision. Do not guess it was unsent.
    const intent = pending.current ?? (payload ? {
      schemaVersion: 2 as const, commandId: crypto.randomUUID(), clientRequestId: crypto.randomUUID(),
      sessionId: `work-${work.id}`, workId: work.id,
      expected: { workRevision: work.revision, workflowRevision: state.revision, capabilityVersion: capability.version }, payload,
    } : null);
    if (!intent) return;
    pending.current = intent;
    setBusy(true); setError('');
    try {
      const result = await sendPlanningCommand(project, intent);
      if (!alive.current) return;
      pending.current = null;
      if ('quoteId' in result) {
        setQuote(result); setConsent(false);
        setState((prior) => prior ? { ...prior, revision: result.workflowRevision, phase: prior.phase === 'NOT_STARTED' ? 'WAIT_COST' : prior.phase } : prior);
        if (state.phase === 'NOT_STARTED') onStateRef.current('WAIT_COST');
      }
      else { setState(result); onStateRef.current(result.phase); setQuote(null); onChanged(work.id); }
    } catch (reason) {
      if (alive.current) {
        const code = reason instanceof ApiError ? (reason.body as { detail?: { code?: string } } | undefined)?.detail?.code : undefined;
        // A server's explicit 4xx rejection has no ambiguous acceptance. Only
        // transport failures retain an intent for exact replay.
        if (reason instanceof ApiError && reason.status >= 400 && reason.status < 500) {
          pending.current = null; setQuote(null); setConsent(false);
        }
        setError(code ? t(`director.execution.errors.${code}`, { defaultValue: code }) : reason instanceof Error ? reason.message : String(reason));
      }
    } finally { if (alive.current) setBusy(false); }
  }, [busy, state, capability, work.id, work.revision, project, onChanged, t]);

  const canQuote = Boolean(state && ['NOT_STARTED', 'WAIT_COST', 'FAILED_RECOVERABLE', 'CANCELLED'].includes(state.phase) && !['PLANNING_INPUT_CHANGED', 'SNAPSHOT_CORRUPT'].includes(state.errorCode ?? ''));
  useEffect(() => {
    quoteAction.current = canQuote ? () => void perform({ type: 'planning.quote', maxOutputTokens }) : null;
    return () => { quoteAction.current = null; };
  }, [quoteAction, canQuote, perform, maxOutputTokens]);

  const cp = state?.checkpoint;
  useEffect(() => {
    setQuestionIndex(0); setSelected(null); setFreeText(''); setAnswers({});
  }, [cp?.id]);
  const questions = cp?.payload.specQuestions ?? [];
  const pageIndex = Math.min(questionIndex, questions.length);
  const currentQuestion = pageIndex > 0 ? questions[pageIndex - 1] : null;
  const decide = (decision: 'select' | 'adopt' | 'skip' | 'return') => {
    if (!cp) return;
    void perform({ type: 'planning.decide', checkpointId: cp.id, resumeToken: cp.resumeToken, payloadHash: cp.payloadHash, decision,
      ...(decision === 'select' ? { optionId: selected, freeText, answers } : {}) });
  };
  if (state?.phase === 'NOT_STARTED' && hasDocuments) return null;

  return <section className="dc-planning dc-message" aria-label={t('director.planning.title')}>
    <h3>{t('director.planning.title')}</h3>
    <p>{t(`director.planning.phase.${state?.phase ?? 'loading'}`)}</p>
    <p className="dc-planning-hint">{t('director.planning.scopeHint')}</p>
    {!!state?.budgets.length && <ol>{state.budgets.map((budget) => <li key={budget.id}>
      {t(`director.planning.group.${budget.plan.group}`)} · {t('director.planning.reserved', { used: budget.callsReserved, total: budget.plan.limits.maxCalls })}
    </li>)}</ol>}
    {state?.errorCode && <p role="alert">{t(`director.execution.errors.${state.errorCode}`, { defaultValue: state.errorCode })}</p>}
    {error && <div role="alert">{error}{pending.current && <button type="button" disabled={busy} onClick={() => void perform()}>{t('director.planning.retryIntent')}</button>}</div>}
    {canQuote && !quote && !pending.current && <button type="button" disabled={busy || !capability} onClick={() => void perform({ type: 'planning.quote', maxOutputTokens })}>{t('director.planning.quote')}</button>}
    {quote && <div className="dc-planning-quote" role="group" aria-label={t('director.planning.budget')}>
      <strong>{t(`director.planning.group.${quote.plan.group}`)}</strong>
      <p>{quote.plan.stages.map((stage) => t(`director.planning.stage.${stage}`)).join(' → ')}</p>
      <p>{quote.plan.model}</p>
      <p>{t('director.planning.limit', { calls: quote.plan.limits.maxCalls, perCall: quote.plan.limits.maxOutputTokensPerCall, total: quote.plan.limits.maxTotalOutputTokens })}</p>
      <p>{t('director.planning.expires', { time: new Date(quote.expiresAt * 1000).toLocaleTimeString() })}</p>
      <p className="dc-cost-warning">{t('director.planning.unknownCost')}</p>
      <label><input type="checkbox" checked={consent} disabled={busy || !!pending.current} onChange={(e) => setConsent(e.target.checked)} />{t('director.planning.consent')}</label>
      <div className="dc-card-actions"><button type="button" disabled={busy || !!pending.current} onClick={() => setQuote(null)}>{t('director.cancel')}</button>
        <button type="button" className="dc-primary-button" disabled={busy || !consent || !!pending.current} onClick={() => void perform({ type: 'planning.grant', quoteId: quote.quoteId, planHash: quote.planHash, unknownCostConsent: consent })}>{t('director.planning.grant')}</button></div>
    </div>}
    {state?.phase === 'WAIT_DIRECTION' && cp && <fieldset disabled={busy || !!pending.current} className="dc-planning-options">
      <legend>{currentQuestion?.question ?? t('director.planning.chooseDirection')}</legend>
      {pageIndex === 0 && <>{cp.payload.options?.map((option, index) => <div key={option.id}><label className={`dc-planning-option${selected === option.id ? ' is-selected' : ''}`}>
        <span className="dc-question-number">{index + 1}</span>
        <input type="radio" aria-label={option.logline} name={`direction-${work.id}`} checked={selected === option.id} onChange={() => { setSelected(option.id); if (questions.length) setQuestionIndex(1); }} />
        <strong>{option.logline}</strong><p>{option.difference}</p>
      </label><details className="dc-direction-details"><summary>{t('director.planning.directionDetails')}</summary>
        <dl>{(['goal', 'obstacle', 'stakes', 'tone'] as const).map((key) => <div key={key}><dt>{t(`director.planning.${key}`)}</dt><dd>{option[key]}</dd></div>)}</dl>
        {option.productionRisks.length > 0 && <p>{t('director.planning.risks')} · {option.productionRisks.join(' / ')}</p>}
      </details></div>)}
      <button type="button" onClick={() => setSelected(null)}>{t('director.planning.customDirection')}</button>
      <label>{t('director.planning.freeText')}<textarea value={freeText} onChange={(e) => setFreeText(e.target.value)} /></label></>}
      {currentQuestion && <textarea aria-label={currentQuestion.question} value={answers[currentQuestion.id] ?? ''} onChange={(e) => setAnswers((prior) => ({ ...prior, [currentQuestion.id]: e.target.value }))} />}
      {questions.length > 0 && <nav className="dc-question-pages" aria-label={t('director.planning.questionNavigation')}>
        <button type="button" aria-label={t('director.planning.previousQuestion')} disabled={pageIndex === 0} onClick={() => setQuestionIndex(pageIndex - 1)}><ChevronDown size={14} /></button>
        <span aria-live="polite">{pageIndex + 1} / {questions.length + 1}</span>
        <button type="button" aria-label={t('director.planning.nextQuestion')} disabled={pageIndex === questions.length} onClick={() => setQuestionIndex(pageIndex + 1)}><ChevronDown size={14} /></button>
      </nav>}
      <div className="dc-card-actions"><button type="button" onClick={() => decide('skip')}>{t('director.planning.skip')}</button>
        <button type="button" className="dc-primary-button" disabled={(!selected && !freeText.trim()) || cp.payload.specQuestions?.some((item) => !answers[item.id]?.trim())} onClick={() => decide('select')}>{t('director.planning.confirmDirection')}</button></div>
    </fieldset>}
    {state?.phase === 'WAIT_OUTLINE' && cp && <div>
      {(['outline', 'characters', 'scenes', 'props'] as const).map((key) => <details key={key}><summary>{t(`director.section.${key}`)}</summary><pre>{cp.payload.documents?.[key]}</pre></details>)}
      <p>{t('director.planning.adoptHint')}</p>
      <div className="dc-card-actions"><button type="button" disabled={busy || !!pending.current} onClick={() => decide('skip')}>{t('director.planning.skip')}</button><button type="button" className="dc-primary-button" disabled={busy || !!pending.current} onClick={() => decide('adopt')}>{t('director.planning.adopt')}</button></div>
    </div>}
    {state?.phase === 'WAIT_INPUT' && <button type="button" disabled={busy || !!pending.current} onClick={() => decide('return')}>{t('director.planning.return')}</button>}
    {state?.phase === 'EXEC' && <div className="dc-card-actions"><button type="button" disabled={busy || !!pending.current} onClick={() => void perform({ type: 'planning.cancel' })}>{t('director.planning.stop')}</button><button type="button" disabled={busy || !!pending.current} onClick={() => void perform({ type: 'planning.resume' })}>{t('director.planning.resume')}</button></div>}
  </section>;
}

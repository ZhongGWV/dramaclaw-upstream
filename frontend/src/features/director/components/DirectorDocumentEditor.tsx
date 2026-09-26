// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 ClaymoreLab
/** Pin the editing baseline; polling must never silently rebase a user's text. */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from './DirectorReferenceIcon';
import { DirectorRichText } from './DirectorRichText';
import { getCanonicalDocuments, listDirectorDrafts, privateDraftCommand, saveDirectorDraft,
  type DirectorDocument, type DirectorPrivateDraft, type DirectorWork } from '@/api/director';

export function DirectorDocumentEditor({ project, work, initial, currentVersion, readOnly, busy, error, label, onClose, onSave, onPropose, sections, onSection, onReference }: {
  project: string; work: DirectorWork; initial: DirectorDocument; currentVersion: number; readOnly: boolean;
  busy: boolean; error: string; label: string; onClose: () => void;
  onSave: (text: string, version: number) => void; onPropose: (text: string, version: number) => void;
  sections?: Array<{ id: string; label: string; selected: boolean }>; onSection?: (id: string) => void;
  onReference?: (text: string, version: number) => void;
}) {
  const { t } = useTranslation();
  const [baseline] = useState(initial);
  const [text, setText] = useState(initial.content);
  const [documentId, setDocumentId] = useState(initial.document_id ?? '');
  const [drafts, setDrafts] = useState<DirectorPrivateDraft[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<DirectorPrivateDraft | null>(null);
  const [draftId, setDraftId] = useState<string>(() => crypto.randomUUID());
  const [draftRevision, setDraftRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedText, setSavedText] = useState<string | null>(null);
  const [draftError, setDraftError] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [selectionWarning, setSelectionWarning] = useState(false);
  const intent = useRef<ReturnType<typeof privateDraftCommand> | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLElement>('header button')?.focus();
    return () => previous?.focus();
  }, []);
  const stale = currentVersion !== baseline.version;
  const disabled = readOnly || busy || saving || stale;
  useEffect(() => {
    let active = true;
    void Promise.all([getCanonicalDocuments(project, work.id), listDirectorDrafts(project, work.id)]).then(([projection, values]) => {
      if (!active) return;
      const id = projection.documents.find((doc) => doc.docKey === baseline.doc_key)?.documentId;
      if (id) { setDocumentId(id); setDrafts(values.filter((draft) => draft.documentId === id)); }
    }).catch(() => { if (active) setDraftError(true); });
    return () => { active = false; };
  }, [project, work.id, baseline.doc_key]);
  useEffect(() => {
    if (readOnly || text === baseline.content || text === savedText) return;
    const preventLoss = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', preventLoss);
    return () => window.removeEventListener('beforeunload', preventLoss);
  }, [readOnly, text, baseline.content, savedText]);
  const saveDraft = async () => {
    if (disabled || !documentId) return;
    const previous = intent.current;
    if (!previous || previous.payload.text !== text || previous.payload.clientDraftId !== draftId || previous.payload.draftRevision !== draftRevision) {
      intent.current = privateDraftCommand(work, { documentId, clientDraftId: draftId, revision: draftRevision, baseVersion: baseline.version, text });
    }
    setSaving(true); setDraftError(false);
    try {
      const saved = await saveDirectorDraft(project, intent.current!);
      setDraftRevision(saved.revision); setSavedText(saved.text); intent.current = null;
      setDrafts((previous) => [saved, ...previous.filter((draft) => draft.clientDraftId !== saved.clientDraftId)]);
    } catch { setDraftError(true); }
    finally { setSaving(false); }
  };
  const close = () => {
    if (!readOnly && text !== baseline.content && text !== savedText && !window.confirm(t('director.editorDraft.unsavedClose'))) return;
    onClose();
  };
  return <div ref={dialog} className="dc-editor-overlay dc-screenplay-editor" role="dialog" aria-modal="true" aria-label={t('director.editor')} onKeyDown={(event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') { event.preventDefault(); if (!disabled) void saveDraft(); }
    if (event.key === 'Escape') { event.stopPropagation(); if (selectedDraft) setSelectedDraft(null); else if (showDrafts) setShowDrafts(false); else close(); }
    if (event.key === 'Tab') {
      const root = selectedDraft ? event.currentTarget.querySelector('[role="dialog"]') : event.currentTarget;
      const items = [...(root?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),[contenteditable="true"]') ?? [])];
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }}>
    <header><strong>{work.title} · {label}</strong><span>{t('director.version', { number: baseline.version })}</span>
      <button type="button" disabled={saving || busy} onClick={close} aria-label={t('director.close')}><X size={20} /></button></header>
    <DirectorRichText value={text} onChange={setText} readOnly={disabled} label={label} sections={sections} onSection={(id) => {
      if (text !== baseline.content && text !== savedText && !window.confirm(t('director.editorDraft.unsavedClose'))) return;
      onSection?.(id);
    }} onSelection={onReference ? (selected) => {
      if (text !== baseline.content || stale) { setSelectionWarning(true); return; }
      onReference(selected, baseline.version);
    } : undefined} />
    <div className="dc-editor-safety">
      {stale && <p role="alert">{t('director.editorDraft.stale')}</p>}
      {(error || draftError) && <p role="alert">{error || t('director.editorDraft.failed')}</p>}
      {selectionWarning && <p role="alert">{t('director.surface.saveSelectionFirst')}</p>}
      {savedText === text && <p role="status">{t('director.editorDraft.saved')}</p>}
      <div className="dc-editor-actions"><button type="button" aria-expanded={showDrafts} onClick={() => setShowDrafts(!showDrafts)}>{t('director.editorDraft.privateTitle')}</button>{!readOnly && <>
        <button type="button" disabled={disabled || !documentId} onClick={() => void saveDraft()}>{t('director.editorDraft.savePrivate')}</button>
        <button type="button" disabled={disabled} onClick={() => onPropose(text, baseline.version)}>{t('director.proposeRevision')}</button>
        <button type="button" className="dc-primary-button" disabled={disabled} onClick={() => onSave(text, baseline.version)}>{t('director.save')}</button>
      </>}</div>
    </div>
    {showDrafts && <aside className="dc-private-drafts">
      <strong>{t('director.editorDraft.privateTitle')}</strong>
      <p>{t('director.editorDraft.privateHint')}</p>
      {drafts.map((draft) => <button type="button" key={draft.clientDraftId} onClick={() => setSelectedDraft(draft)}>
        {t('director.editorDraft.version', { version: draft.baseVersion, revision: draft.revision })}
      </button>)}
    </aside>}
    {selectedDraft && <div className="dc-overlay"><div className="dc-small-modal" role="dialog" aria-modal="true" aria-label={t('director.editorDraft.preview')}>
      <h2>{t('director.editorDraft.preview')}</h2><p>{t('director.editorDraft.privateHint')}</p>
      {selectedDraft.baseVersion !== baseline.version && <p role="alert">{t('director.editorDraft.staleDraft')}</p>}
      <textarea value={selectedDraft.text} readOnly aria-label={t('director.editorDraft.retained')} />
      <footer><button type="button" onClick={() => setSelectedDraft(null)}>{t('director.close')}</button>
        <button type="button" disabled={disabled || selectedDraft.baseVersion !== baseline.version} onClick={() => {
          if (text !== baseline.content && text !== savedText && !window.confirm(t('director.editorDraft.unsavedClose'))) return;
          setText(selectedDraft.text); setSavedText(selectedDraft.text); setDraftId(selectedDraft.clientDraftId);
          setDraftRevision(selectedDraft.revision); intent.current = null; setSelectedDraft(null);
        }}>{t('director.editorDraft.restore')}</button></footer>
    </div></div>}
  </div>;
}

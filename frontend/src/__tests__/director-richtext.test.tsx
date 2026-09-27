// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 ClaymoreLab
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Editor } from '@tiptap/react';
import { DirectorRichText, requiresSourceEditor, richTextExtensions } from '@/features/director/components/DirectorRichText';
import { DirectorSettingsDialog } from '@/features/director/components/DirectorSettingsDialog';
import { DirectorHistoryPopover } from '@/features/director/components/DirectorHistoryPopover';
import type { DirectorWork } from '@/api/director';
import { directorTokenLimit, readDirectorPreference } from '@/features/director/director-ui-state';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
const historyApi = vi.hoisted(() => ({ listDirectorWorks: vi.fn(), updateDirectorHistory: vi.fn() }));
vi.mock('@/api/director', () => historyApi);
afterEach(() => { cleanup(); localStorage.clear(); });

describe('rich editor and Markdown save boundary', () => {
  it('does not save or normalize content on open, zoom or source view changes', async () => {
    const change = vi.fn(), raw = '# Title\n\nOriginal text.\n\n';
    render(<DirectorRichText value={raw} onChange={change} readOnly={false} label="Outline" />);
    await act(async () => {});
    expect(screen.getByRole('textbox')).toHaveTextContent('Title');
    fireEvent.click(screen.getByRole('button', { name: 'director.surface.zoomIn' }));
    fireEvent.click(screen.getByRole('button', { name: 'director.surface.sourceView' }));
    expect(screen.getByRole('textbox')).toHaveValue(raw);
    fireEvent.click(screen.getByRole('button', { name: 'director.surface.richView' }));
    expect(change).not.toHaveBeenCalled();
  });

  it.each(['<custom>Keep</custom>', '![alt](image.png)', '---\ntitle: A\n---', 'Footnote[^x]\n\n[^x]: Keep'])('retains unsupported source literally: %s', async raw => {
    const change = vi.fn();
    render(<DirectorRichText value={raw} onChange={change} readOnly={false} label="Outline" />);
    await act(async () => {});
    expect(requiresSourceEditor(raw)).toBe(true);
    expect(screen.getByRole('textbox')).toHaveValue(raw);
    expect(screen.getByRole('button', { name: 'director.surface.richView' })).toBeDisabled();
    expect(change).not.toHaveBeenCalled();
  });

  it('renders GFM tables, nested lists, tasks and Unicode without dropping text', () => {
    const raw = '# Title 😀\n\n| Item | Owner |\n| --- | --- |\n| key | Ada |\n\n- First\n  - Child\n\n- [x] Done\n\n**bold** and _italic_';
    const editor = new Editor({ extensions: richTextExtensions(), content: raw, contentType: 'markdown' });
    const output = editor.getMarkdown();
    expect(editor.getHTML()).toContain('<table');
    for (const token of ['Title 😀', 'key', 'Ada', 'Child', '[x] Done', '**bold**']) expect(output).toContain(token);
    editor.destroy();
  });

  it('formatting and undo update the actual Markdown, not a decorative toolbar', () => {
    const editor = new Editor({ extensions: richTextExtensions(), content: 'Hello world', contentType: 'markdown' });
    editor.commands.setTextSelection({ from: 1, to: 6 });
    editor.commands.toggleBold();
    expect(editor.getMarkdown()).toBe('**Hello** world');
    editor.commands.undo();
    expect(editor.getMarkdown()).toBe('Hello world');
    editor.commands.redo();
    expect(editor.getMarkdown()).toBe('**Hello** world');
    editor.destroy();
  });

  it('read-only blocks formatting and external unsupported restores switch safely to source', async () => {
    const change = vi.fn();
    const view = render(<DirectorRichText value="Text" onChange={change} readOnly label="Outline" />);
    expect(screen.getByRole('button', { name: 'director.surface.bold' })).toBeDisabled();
    expect(screen.getByRole('textbox')).toHaveAttribute('contenteditable', 'false');
    view.rerender(<DirectorRichText value="<custom>Keep</custom>" onChange={change} readOnly label="Outline" />);
    await act(async () => {});
    expect(screen.getByRole('textbox')).toHaveValue('<custom>Keep</custom>');
    expect(change).not.toHaveBeenCalled();
  });
});

describe('truthful local settings', () => {
  it('never exposes automatic spending; cancel does not persist token changes', () => {
    const save = vi.fn(), close = vi.fn();
    render(<DirectorSettingsDialog maxOutputTokens={4096} onSave={save} onClose={close} onMethods={vi.fn()} />);
    expect(screen.getByRole('switch', { name: 'director.surface.autoGenerate' })).toBeDisabled();
    expect(screen.getByRole('switch', { name: 'director.surface.budget' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'director.ui.advanced' }));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '8192' } });
    fireEvent.click(screen.getByRole('button', { name: 'director.close' }));
    expect(close).toHaveBeenCalledOnce(); expect(save).not.toHaveBeenCalled();
    expect(directorTokenLimit()).toBe(4096);
  });
  it('saves the real token limit only on explicit confirmation', () => {
    const save = vi.fn();
    render(<DirectorSettingsDialog maxOutputTokens={4096} onSave={save} onClose={vi.fn()} onMethods={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'director.ui.advanced' }));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '8192' } });
    fireEvent.click(screen.getByRole('button', { name: 'director.ui.done' }));
    expect(save).toHaveBeenCalledWith(8192); expect(directorTokenLimit()).toBe(8192);
    localStorage.setItem('director:ui:outputTokens', '99999'); expect(directorTokenLimit()).toBe(4096);
    localStorage.setItem('director:ui:composer', '{}'); expect(readDirectorPreference('composer', '')).toBe('');
  });
});

describe('history commands preserve uncertain intent', () => {
  it('allows only the original restore retry after a transport failure', async () => {
    const rows = ['first', 'second'].map(id => ({ id, title: id, revision: 4, updated_at: 1 }) as DirectorWork);
    historyApi.listDirectorWorks.mockResolvedValue(rows);
    historyApi.updateDirectorHistory.mockRejectedValueOnce(new Error('Connection lost')).mockResolvedValueOnce(rows[0]);
    const changed = vi.fn().mockResolvedValue(undefined);
    render(<DirectorHistoryPopover project="fixture" works={rows} anchor={null} onClose={vi.fn()} onOpen={vi.fn()} onChanged={changed} />);
    fireEvent.click(screen.getByRole('button', { name: 'director.surface.archivedHistory' }));
    await screen.findAllByRole('button', { name: 'director.surface.restoreConversation' });
    fireEvent.click(screen.getAllByRole('button', { name: 'director.surface.restoreConversation' })[0]);
    await screen.findByRole('alert');
    expect(screen.getAllByRole('button', { name: 'director.surface.restoreConversation' })[0]).not.toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'director.surface.restoreConversation' })[1]).toBeDisabled();
    for (const button of screen.getAllByRole('button', { name: 'director.surface.rename' })) expect(button).toBeDisabled();
    expect(screen.getByRole('button', { name: 'director.surface.activeHistory' })).toBeDisabled();
    fireEvent.click(screen.getAllByRole('button', { name: 'director.surface.restoreConversation' })[0]);
    await waitFor(() => expect(changed).toHaveBeenCalledWith('first', false));
    expect(historyApi.updateDirectorHistory).toHaveBeenCalledTimes(2);
    expect(historyApi.updateDirectorHistory.mock.calls[1]).toEqual(historyApi.updateDirectorHistory.mock.calls[0]);
    expect(historyApi.updateDirectorHistory.mock.calls[0][2]).toMatchObject({ expected_revision: 4, action: 'restore' });
  });
});

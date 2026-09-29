// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 ClaymoreLab
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { emptyStream, reduceExecutionEvents, useExecutionStream } from '@/features/director/useExecutionStream';
import { ConversationScroll } from '@/features/director/components/DirectorConversation';
import { getExecutionEvents, type ExecutionEvent } from '@/api/director-execution';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/api/director-execution', () => ({ getExecutionEvents: vi.fn() }));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.resetAllMocks(); });
const delta = (seq: number, text: string, runId = 'r1'): ExecutionEvent => ({ seq, eventId: `e${seq}`, type: 'text.delta', sessionId: 's', runId, payload: { text }, createdAt: 0 });

it('replays ordered deltas once, separating runs and preserving Unicode', () => {
  const first = reduceExecutionEvents(emptyStream(), [delta(2, '界'), delta(1, '世')]);
  const next = reduceExecutionEvents(first, [delta(2, '界'), delta(3, '!'), delta(4, 'Other', 'r2')]);
  expect(next.runs.r1.text).toBe('世界!');
  expect(next.runs.r2.text).toBe('Other');
  expect(next.cursor).toBe(4);
});

it('ignores a late response after switching works and aborts the old read', async () => {
  let oldResolve!: (value: { schemaVersion: 2; events: ExecutionEvent[]; nextSeq: number }) => void;
  vi.mocked(getExecutionEvents).mockImplementationOnce(() => new Promise(resolve => { oldResolve = resolve; }))
    .mockResolvedValue({ schemaVersion: 2, events: [delta(1, 'new')], nextSeq: 1 });
  const { result, rerender } = renderHook(({ id }) => useExecutionStream('p', id, true), { initialProps: { id: 'old' } });
  rerender({ id: 'new' });
  await waitFor(() => expect(result.current.state.runs.r1.text).toBe('new'));
  await act(async () => oldResolve({ schemaVersion: 2, events: [delta(1, 'OLD')], nextSeq: 1 }));
  expect(result.current.state.runs.r1.text).toBe('new');
  expect(vi.mocked(getExecutionEvents).mock.calls[0][3]?.aborted).toBe(true);
});

it('drains full pages and reconnects using the last durable cursor', async () => {
  vi.useFakeTimers();
  const page = Array.from({ length: 200 }, (_, i) => delta(i + 1, 'a'));
  vi.mocked(getExecutionEvents).mockResolvedValueOnce({ schemaVersion: 2, events: page, nextSeq: 200 })
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue({ schemaVersion: 2, events: [delta(201, 'b')], nextSeq: 201 });
  const { result } = renderHook(() => useExecutionStream('p', 'w', true));
  await act(async () => { await vi.advanceTimersByTimeAsync(5); });
  expect(result.current.reconnecting).toBe(true);
  expect(result.current.state.runs.r1.text.length).toBe(200);
  await act(async () => { await vi.advanceTimersByTimeAsync(1100); });
  expect(result.current.reconnecting).toBe(false);
  expect(result.current.state.runs.r1.text).toBe('a'.repeat(200) + 'b');
  expect(vi.mocked(getExecutionEvents).mock.calls[2][2]).toBe(200);
});

it('does not pull the reader down when they are inspecting earlier passages', () => {
  const { container, rerender } = render(<ConversationScroll revision={1}>First</ConversationScroll>);
  const viewport = container.querySelector('.dc-messages')!;
  Object.defineProperties(viewport, { scrollHeight: { value: 1000 }, clientHeight: { value: 100 } });
  viewport.scrollTop = 200;
  fireEvent.scroll(viewport);
  rerender(<ConversationScroll revision={2}>Second</ConversationScroll>);
  expect(viewport.scrollTop).toBe(200);
  fireEvent.click(screen.getByRole('button', { name: 'director.stream.latest' }));
  expect(viewport.scrollTop).toBe(1000);
});

'use client';

import { useKeel } from './store';
import { toast, useOverlay } from './ui-store';

/** Board draft takes a moment to "build" so the skeleton is visible. */
export function startBuildDraft() {
  const o = useOverlay.getState();
  if (o.boardBuilding) return;
  const { data } = useKeel.getState();
  if (!data.board.sections.some((s) => s.included)) {
    toast('Nothing to build', 'Tick at least one section, then build the draft.', 'warning');
    return;
  }
  const rebuilding = !!data.board.draft;
  o.set({ boardBuilding: true });
  const reveal = () => document.getElementById('draft')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(reveal, 80);
  setTimeout(() => {
    useKeel.getState().buildDraft();
    useOverlay.getState().set({ boardBuilding: false });
    toast(rebuilding ? 'Draft rebuilt' : 'Draft built', 'Edit any paragraph before you send it.');
    setTimeout(reveal, 50);
  }, 1100);
}

export async function copyText(text: string, success: string): Promise<boolean> {
  try {
    if (!navigator.clipboard) throw new Error('no clipboard');
    await navigator.clipboard.writeText(text);
    toast(success);
    return true;
  } catch {
    toast('Could not copy', 'Your browser blocked the clipboard. Select the text and copy it with your keyboard instead.', 'error');
    return false;
  }
}

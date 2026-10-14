'use client';

import { useSyncExternalStore } from 'react';

const isMac = () => /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

/** "⌘" on Apple platforms, "Ctrl" elsewhere. */
export function useModKey() {
  return useSyncExternalStore(
    () => () => {},
    () => (isMac() ? '⌘' : 'Ctrl'),
    () => 'Ctrl',
  );
}

export const isTypingTarget = (t: EventTarget | null) =>
  t instanceof HTMLElement && !!t.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]');

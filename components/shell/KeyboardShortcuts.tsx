'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useKeel } from '@/lib/store';
import { useOverlay } from '@/lib/ui-store';
import { isTypingTarget } from '@/lib/platform';

const GO: Record<string, string> = { h: '/', c: '/contracts', a: '/ai', t: '/tribunal', r: '/accounts', b: '/board' };

const anyDialogOpen = () => !!document.querySelector('[role="dialog"], [role="alertdialog"]');

/** Global keys. Ignored while typing in a field, except Cmd/Ctrl K. */
export function KeyboardShortcuts() {
  const router = useRouter();
  const gAt = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const overlay = useOverlay.getState();
      const keel = useKeel.getState();

      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        overlay.set({ paletteOpen: !overlay.paletteOpen });
        return;
      }
      if (e.defaultPrevented) return;
      if (e.key === 'Escape') {
        // Modals handle their own Escape. The mobile sheet and tray close here.
        if (!anyDialogOpen() && keel.ui.trayOpen && window.matchMedia('(max-width: 859.98px)').matches) keel.setTray(false);
        return;
      }
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey || anyDialogOpen()) return;

      if (e.key === '`') {
        e.preventDefault();
        keel.setTray(!keel.ui.trayOpen);
        return;
      }
      if (e.key === '[') {
        e.preventDefault();
        keel.toggleSidebar();
        return;
      }
      if (e.key === '?') {
        e.preventDefault();
        keel.setTray(true, 'shortcuts');
        return;
      }
      const k = e.key.toLowerCase();
      if (Date.now() - gAt.current < 1200 && GO[k]) {
        e.preventDefault();
        gAt.current = 0;
        router.push(GO[k]);
        return;
      }
      if (k === 'g' && !e.shiftKey) {
        gAt.current = Date.now();
        return;
      }
      gAt.current = 0;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  return null;
}

'use client';

import { AlertCircle, AlertTriangle, CheckCircle, XClose } from '@untitledui/icons';
import { cx } from '@/utils/cx';
import { useToasts } from '@/lib/ui-store';
import { useKeel } from '@/lib/store';
import { useIsMobileNav, useMediaQuery } from '@/lib/hooks';

const ICON = { success: CheckCircle, warning: AlertTriangle, error: AlertCircle };
const COLOR = { success: 'text-fg-success-primary', warning: 'text-fg-warning-primary', error: 'text-fg-error-primary' };

export function Toasts() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  const trayOpen = useKeel((s) => s.ui.trayOpen);
  const mobile = useIsMobileNav();
  const phone = useMediaQuery('(max-width: 639.98px)');
  // Sit above the tray so a toast never hides behind it. On phones, toasts drop in from the top
  // so they never cover a drawer's footer buttons or the bottom sheet.
  const place = phone
    ? { top: 'calc(12px + env(safe-area-inset-top))' }
    : { bottom: trayOpen ? (mobile ? 'calc(70dvh + 12px)' : 'calc(var(--tray-open) + 16px)') : 'calc(var(--tray-h) + 16px + env(safe-area-inset-bottom))' };
  return (
    <div
      role="status"
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed right-4 left-4 z-[150] flex flex-col items-stretch gap-2 transition-[bottom] duration-200 sm:left-auto sm:w-[380px]"
      style={place}
    >
      {toasts.map((t) => {
        const Icon = ICON[t.tone];
        return (
          <div key={t.id} className="pointer-events-auto flex items-start gap-3 rounded-xl border border-secondary bg-primary p-4 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200 max-sm:slide-in-from-top-2">
            <Icon className={cx('mt-0.5 size-5 shrink-0', COLOR[t.tone])} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary">{t.title}</p>
              {t.body && <p className="mt-0.5 text-sm text-tertiary">{t.body}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="-mt-1.5 -mr-1.5 grid size-9 shrink-0 place-items-center rounded-lg text-fg-quaternary hover:bg-primary_hover hover:text-fg-quaternary_hover"
            >
              <XClose className="size-5" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}

'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useHydrated, useIsMobileNav } from '@/lib/hooks';
import { useKeel } from '@/lib/store';
import { useOverlay } from '@/lib/ui-store';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Tray } from './Tray';
import { Toasts } from './Toasts';
import { CommandPalette } from './CommandPalette';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { ResetConfirm } from './ResetConfirm';
import { GlobalModals } from './GlobalModals';

const TITLES: Record<string, string> = {
  '/': 'Home',
  '/contracts': 'Contracts',
  '/ai': 'AI register',
  '/tribunal': 'Tribunal risk',
  '/accounts': 'Account research',
  '/board': 'Board pack',
  '/case-for-keel': 'The case for Keel',
};

export function AppShell({ children }: { children: ReactNode }) {
  const ready = useHydrated();
  const pathname = usePathname();
  const trayOpen = useKeel((s) => s.ui.trayOpen);
  const resetCount = useOverlay((s) => s.resetCount);
  const mobile = useIsMobileNav();

  useEffect(() => {
    document.title = `${TITLES[pathname] ?? 'Keel'} · Keel`;
    useOverlay.getState().set({ navOpen: false });
    document.getElementById('main')?.scrollTo({ top: 0 });
  }, [pathname]);

  if (!ready) {
    return (
      <div className="flex h-dvh items-center justify-center bg-secondary" aria-busy="true">
        <span className="sr-only">Loading Keel</span>
      </div>
    );
  }

  const padBottom = trayOpen ? (mobile ? 'calc(70dvh + 24px)' : 'calc(var(--tray-open) + 24px)') : 'calc(var(--tray-h) + 48px + env(safe-area-inset-bottom))';

  return (
    <>
      <a href="#main" className="sr-only z-[300] rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary shadow-lg focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <div className="flex h-dvh overflow-hidden">
        <Sidebar />
        <div className="relative flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main id="main" tabIndex={-1} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pt-5 outline-hidden min-[860px]:px-8 min-[860px]:pt-8" style={{ paddingBottom: padBottom }}>
            <div key={resetCount} className="mx-auto w-full max-w-[1200px]">
              {children}
            </div>
          </main>
          <Tray />
        </div>
      </div>
      <Toasts />
      <CommandPalette />
      <GlobalModals />
      <ResetConfirm />
      <KeyboardShortcuts />
    </>
  );
}

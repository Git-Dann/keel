'use client';

import { Bell01, Keyboard01, Menu02, Moon01, SearchLg, Sun } from '@untitledui/icons';
import { Button } from '@/components/ui/untitled/base/buttons/button';
import { Tooltip } from '@/components/ui/Tooltip';
import { useAlerts, useKeel } from '@/lib/store';
import { useOverlay } from '@/lib/ui-store';
import { useModKey } from '@/lib/platform';
import { useTheme } from '@/lib/theme';

export function TopBar() {
  const mod = useModKey();
  const setOverlay = useOverlay((s) => s.set);
  const navOpen = useOverlay((s) => s.navOpen);
  const { theme, toggle } = useTheme();
  const setTray = useKeel((s) => s.setTray);
  const ui = useKeel((s) => s.ui);
  const alerts = useAlerts();

  const openTab = (tab: 'alerts' | 'shortcuts') => setTray(!(ui.trayOpen && ui.trayTab === tab), tab);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-secondary bg-primary px-3 pt-[env(safe-area-inset-top)] min-[860px]:gap-3 min-[860px]:px-6">
      <Button
        color="tertiary"
        size="md"
        iconLeading={Menu02}
        aria-label="Open menu"
        aria-expanded={navOpen}
        onPress={() => setOverlay({ navOpen: true })}
        className="min-[860px]:hidden"
      />
      <button
        type="button"
        onClick={() => setOverlay({ paletteOpen: true })}
        aria-label="Search and run commands"
        aria-haspopup="dialog"
        className="flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-lg text-left text-md text-placeholder ring-primary transition-colors hover:bg-primary_hover min-[860px]:w-full min-[860px]:max-w-[420px] min-[860px]:justify-start min-[860px]:bg-primary min-[860px]:px-3 min-[860px]:shadow-xs min-[860px]:ring-1 min-[860px]:ring-inset"
      >
        <SearchLg className="size-5 shrink-0 text-fg-quaternary" aria-hidden />
        <span className="hidden flex-1 truncate min-[860px]:block">Search contracts, tools, cases…</span>
        <kbd className="hidden rounded border border-secondary bg-secondary px-1.5 font-body text-xs text-quaternary min-[860px]:block">{mod} K</kbd>
      </button>
      <div className="ml-auto flex items-center gap-1">
        <Tooltip content={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          <Button color="tertiary" size="md" iconLeading={theme === 'dark' ? Sun : Moon01} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onPress={toggle} />
        </Tooltip>
        <Tooltip content={alerts.length ? `Alerts (${alerts.length})` : 'Alerts'}>
          <span className="relative inline-flex">
            <Button color="tertiary" size="md" iconLeading={Bell01} aria-label={alerts.length ? `Alerts, ${alerts.length} open` : 'Alerts'} onPress={() => openTab('alerts')} />
            {alerts.length > 0 && <span className="pointer-events-none absolute top-2 right-2 size-2 rounded-full bg-fg-brand-primary ring-2 ring-bg-primary" aria-hidden />}
          </span>
        </Tooltip>
        <Tooltip content="Keyboard shortcuts" kbd="?">
          <Button color="tertiary" size="md" iconLeading={Keyboard01} aria-label="Keyboard shortcuts" onPress={() => openTab('shortcuts')} />
        </Tooltip>
      </div>
    </header>
  );
}

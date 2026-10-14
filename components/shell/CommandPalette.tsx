'use client';

import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, Modal, ModalOverlay } from 'react-aria-components';
import { ChevronUp, Home02, Moon01, Plus, PresentationChart01, RefreshCcw01, Scales02, SearchLg, Upload01, LayersThree01 } from '@untitledui/icons';
import { cx } from '@/utils/cx';
import { useKeel } from '@/lib/store';
import { useOverlay } from '@/lib/ui-store';
import { MODULES, MODULE_ORDER } from '@/lib/modules';
import { TIER_META } from '@/lib/logic/ai';
import { toggleTheme } from '@/lib/theme';
import { startBuildDraft } from '@/lib/actions';

interface Command {
  id: string;
  group: string;
  label: string;
  sub?: string;
  Icon: FC<{ className?: string }>;
  run: () => void;
}

export function CommandPalette() {
  const open = useOverlay((s) => s.paletteOpen);
  const setOverlay = useOverlay((s) => s.set);
  const close = () => setOverlay({ paletteOpen: false });
  return (
    <ModalOverlay
      isOpen={open}
      onOpenChange={(o) => setOverlay({ paletteOpen: o })}
      isDismissable
      className={({ isEntering, isExiting }) =>
        cx('fixed inset-0 z-[110] bg-overlay/60 backdrop-blur-[4px]', isEntering && 'animate-in fade-in duration-150', isExiting && 'animate-out fade-out duration-100')
      }
    >
      <Modal className="mx-auto mt-[10vh] w-[min(620px,calc(100vw-32px))] overflow-hidden rounded-2xl bg-primary shadow-2xl">
        <Dialog aria-label="Search and commands" className="outline-hidden">
          <PaletteBody onDone={close} />
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

function PaletteBody({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const data = useKeel((s) => s.data);
  const setTray = useKeel((s) => s.setTray);
  const setOverlay = useOverlay((s) => s.set);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const commands = useMemo<Command[]>(() => {
    const go = (href: string) => () => router.push(href);
    return [
      { id: 'go-home', group: 'Go to', label: 'Home', Icon: Home02, run: go('/') },
      ...MODULE_ORDER.map((m) => ({ id: `go-${m}`, group: 'Go to', label: MODULES[m].label, Icon: MODULES[m].Icon, run: go(MODULES[m].href) })),
      { id: 'go-pitch', group: 'Go to', label: 'The case for Keel', Icon: PresentationChart01, run: go('/case-for-keel') },
      { id: 'a-upload', group: 'Actions', label: 'Upload a contract', Icon: Upload01, run: () => setOverlay({ uploadOpen: true }) },
      {
        id: 'a-ai',
        group: 'Actions',
        label: 'Add an AI tool',
        Icon: Plus,
        run: () => {
          router.push('/ai');
          setOverlay({ wizard: { step: 1 } });
        },
      },
      { id: 'a-trib', group: 'Actions', label: 'Start a tribunal risk check', Icon: Scales02, run: go('/tribunal?new=1') },
      {
        id: 'a-board',
        group: 'Actions',
        label: 'Build board pack draft',
        Icon: LayersThree01,
        run: () => {
          router.push('/board');
          startBuildDraft();
        },
      },
      { id: 'a-theme', group: 'Actions', label: 'Switch light or dark mode', Icon: Moon01, run: toggleTheme },
      { id: 'a-tray', group: 'Actions', label: 'Open the workbench tray', Icon: ChevronUp, run: () => setTray(true) },
      { id: 'a-reset', group: 'Actions', label: 'Reset demo data', Icon: RefreshCcw01, run: () => setOverlay({ resetConfirmOpen: true }) },
      ...data.contracts.map((c) => ({ id: `c-${c.id}`, group: 'Contracts', label: c.name, sub: c.party, Icon: MODULES.contracts.Icon, run: go(`/contracts?open=${c.id}`) })),
      ...data.ai.map((a) => ({ id: `ai-${a.id}`, group: 'AI tools', label: a.name, sub: `${a.vendor} · ${TIER_META[a.tier].label}`, Icon: MODULES.ai.Icon, run: go(`/ai?open=${a.id}`) })),
      ...data.prospects.map((p) => ({ id: `p-${p.id}`, group: 'Accounts', label: p.name, sub: `${p.sector} · ${p.domain}`, Icon: MODULES.accounts.Icon, run: go(`/accounts?open=${p.id}`) })),
    ];
  }, [data, router, setOverlay, setTray]);

  const items = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return commands;
    return commands.filter((c) => `${c.label} ${c.sub ?? ''} ${c.group}`.toLowerCase().includes(t));
  }, [commands, q]);

  const active = Math.min(sel, Math.max(0, items.length - 1));

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const run = (i: number) => {
    const c = items[i];
    if (!c) return;
    onDone();
    // Let the dialog close and restore focus before running.
    setTimeout(c.run, 10);
  };

  let lastGroup = '';
  return (
    <div>
      <div className="flex h-14 items-center gap-3 border-b border-secondary px-4">
        <SearchLg className="size-5 shrink-0 text-fg-quaternary" aria-hidden />
        <input
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSel(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setSel((active + 1) % Math.max(1, items.length));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setSel((active - 1 + items.length) % Math.max(1, items.length));
            } else if (e.key === 'Home') {
              e.preventDefault();
              setSel(0);
            } else if (e.key === 'End') {
              e.preventDefault();
              setSel(items.length - 1);
            } else if (e.key === 'Enter') {
              e.preventDefault();
              run(active);
            }
          }}
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-autocomplete="list"
          aria-activedescendant={items.length ? `palette-opt-${active}` : undefined}
          aria-label="Search pages, records and actions"
          placeholder="Search or type a command"
          className="min-w-0 flex-1 bg-transparent text-md text-primary outline-hidden placeholder:text-placeholder focus-visible:outline-hidden"
        />
        <kbd className="rounded border border-secondary bg-secondary px-1.5 font-body text-xs text-quaternary">Esc</kbd>
      </div>
      <ul ref={listRef} id="palette-list" role="listbox" aria-label="Results" className="max-h-[min(50vh,420px)] overflow-y-auto p-2">
        {items.length === 0 && (
          <li role="presentation" className="px-3 py-6 text-center text-sm text-tertiary">
            Nothing matches &ldquo;{q.trim()}&rdquo;. Try a contract, tool or page name.
          </li>
        )}
        {items.map((c, i) => {
          const header = c.group !== lastGroup ? c.group : null;
          lastGroup = c.group;
          return (
            <li key={c.id} role="presentation">
              {header && (
                <div role="presentation" className="px-3 pt-3 pb-1 text-xs font-medium text-quaternary">
                  {header}
                </div>
              )}
              <div
                role="option"
                id={`palette-opt-${i}`}
                data-index={i}
                aria-selected={i === active}
                onMouseMove={() => i !== active && setSel(i)}
                onClick={() => run(i)}
                title={c.sub ? `${c.label} · ${c.sub}` : c.label}
                className={cx(
                  'flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-secondary',
                  i === active && 'bg-brand-primary_alt text-brand-secondary dark:bg-tertiary dark:text-primary',
                )}
              >
                <c.Icon className={cx('size-4 shrink-0 text-fg-quaternary', i === active && 'text-fg-brand-primary')} aria-hidden />
                <span className="min-w-0 flex-1 truncate font-medium">{c.label}</span>
                {c.sub && <span className="hidden max-w-[45%] truncate text-xs text-quaternary sm:block">{c.sub}</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

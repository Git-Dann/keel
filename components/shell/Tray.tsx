'use client';

import { useEffect, useRef, useState, type FC } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Bell01, CheckCircle, ChevronDown, ChevronUp, Keyboard01, MessageChatSquare, Send01, XClose } from '@untitledui/icons';
import { format } from 'date-fns';
import { cx } from '@/utils/cx';
import { useAlerts, useKeel } from '@/lib/store';
import { useOverlay } from '@/lib/ui-store';
import { useIsMobileNav } from '@/lib/hooks';
import { useModKey } from '@/lib/platform';
import { SUGGESTED_QUESTIONS } from '@/lib/logic/askKeel';
import { MODULES } from '@/lib/modules';
import type { TrayTab } from '@/lib/types';
import { Tooltip } from '@/components/ui/Tooltip';
import { Button } from '@/components/ui/untitled/base/buttons/button';
import { EmptyState } from '@/components/ui/Primitives';
import { toast } from '@/lib/ui-store';

const TABS: { id: TrayTab; label: string; Icon: FC<{ className?: string }> }[] = [
  { id: 'activity', label: 'Activity', Icon: Activity },
  { id: 'alerts', label: 'Alerts', Icon: Bell01 },
  { id: 'ask', label: 'Ask Keel', Icon: MessageChatSquare },
  { id: 'shortcuts', label: 'Shortcuts', Icon: Keyboard01 },
];

function ActivityTab() {
  const activity = useKeel((s) => s.activity);
  if (!activity.length) return <EmptyState icon={Activity} title="No activity yet">Actions you take in Keel appear here.</EmptyState>;
  return (
    <ol className="divide-y divide-secondary text-sm">
      {activity.map((a, i) => (
        <li key={a.at + i} className="grid grid-cols-[56px_1fr] gap-x-3 px-4 py-2.5 sm:grid-cols-[64px_140px_1fr]">
          <time dateTime={a.at} className="text-quaternary tabular-nums">
            {format(new Date(a.at), 'HH:mm')}
          </time>
          <span className="hidden truncate font-semibold text-secondary sm:block">{a.source}</span>
          <span className="min-w-0 text-tertiary">
            <span className="font-semibold text-secondary sm:hidden">{a.source}: </span>
            {a.message}
          </span>
        </li>
      ))}
    </ol>
  );
}

function AlertsTab({ onOpen }: { onOpen: () => void }) {
  const alerts = useAlerts();
  const dismiss = useKeel((s) => s.dismissAlert);
  const router = useRouter();
  if (!alerts.length) return <EmptyState icon={CheckCircle} title="No alerts">You are all caught up. Keel will flag the next deadline as it gets close.</EmptyState>;
  return (
    <ul className="divide-y divide-secondary">
      {alerts.map((a) => (
        <li key={a.id} className="flex items-start gap-3 px-4 py-3">
          <span className={cx('mt-1.5 size-2 shrink-0 rounded-full', a.severity === 'error' ? 'bg-fg-error-secondary' : 'bg-fg-warning-secondary')} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold break-words text-primary">
              <span className="sr-only">{a.severity === 'error' ? 'Urgent: ' : 'Warning: '}</span>
              {a.title}
            </p>
            <p className="text-sm text-tertiary">
              {MODULES[a.module].label} · {a.detail}
            </p>
          </div>
          <Button
            color="secondary"
            size="sm"
            onPress={() => {
              onOpen();
              router.push(a.href);
            }}
            aria-label={`Open: ${a.title}`}
            className="min-h-9"
          >
            Open
          </Button>
          <Tooltip content="Dismiss. It stays hidden until you reset the demo.">
            <Button color="tertiary" size="sm" iconLeading={XClose} aria-label={`Dismiss alert: ${a.title}`} onPress={() => dismiss(a.id)} className="size-9 justify-center" />
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}

function AskTab() {
  const chat = useKeel((s) => s.chat);
  const ask = useKeel((s) => s.ask);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [chat.length]);
  const send = (text: string) => {
    const t = text.trim();
    if (!t) {
      setError('Type a question first, or pick one of the suggestions.');
      input.current?.focus();
      return;
    }
    setError('');
    ask(t);
    setQ('');
  };
  return (
    <div className="flex h-full flex-col">
      <div ref={list} className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-4" aria-live="polite" aria-label="Conversation">
        <p className="self-start rounded-xl rounded-bl-sm bg-secondary px-3.5 py-2.5 text-sm text-secondary">
          Demo assistant. I answer from this workspace only, by matching keywords. Ask about renewals, AI tools, HR cases, prospects or the board pack.
        </p>
        {chat.map((m) =>
          m.from === 'me' ? (
            <p key={m.id} className="max-w-[80%] self-end rounded-xl rounded-br-sm bg-brand-solid px-3.5 py-2.5 text-sm text-white">
              {m.text}
            </p>
          ) : (
            <div key={m.id} className="max-w-[85%] self-start rounded-xl rounded-bl-sm bg-secondary px-3.5 py-2.5 text-sm text-secondary">
              <p>{m.text}</p>
              {m.items && (
                <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
                  {m.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              )}
            </div>
          ),
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 px-4 pb-2">
        {SUGGESTED_QUESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => send(s)}
            className="min-h-8 rounded-full border border-secondary bg-primary px-3 text-xs font-medium text-tertiary transition-colors hover:border-brand hover:text-brand-secondary"
          >
            {s}
          </button>
        ))}
      </div>
      <form
        className="flex items-start gap-2 border-t border-secondary px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(q);
        }}
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="ask-keel" className="sr-only">
            Ask Keel a question
          </label>
          <input
            ref={input}
            id="ask-keel"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={300}
            placeholder="Ask Keel about this workspace"
            aria-invalid={!!error}
            aria-describedby={error ? 'ask-keel-error' : undefined}
            className="h-10 w-full rounded-lg bg-primary px-3 text-md text-primary shadow-xs ring-1 ring-primary ring-inset placeholder:text-placeholder focus:ring-2 focus:ring-brand focus:outline-hidden"
          />
          {error && (
            <p id="ask-keel-error" className="mt-1 text-sm text-error-primary">
              {error}
            </p>
          )}
        </div>
        <Button type="submit" color="primary" size="md" iconLeading={Send01} aria-label="Send question" />
      </form>
    </div>
  );
}

function ShortcutsTab() {
  const mod = useModKey();
  const showTips = useKeel((s) => s.showTips);
  const setOverlay = useOverlay((s) => s.set);
  const rows: [string, string][] = [
    [`${mod} K`, 'Search and commands'],
    ['`', 'Open or close this tray'],
    ['[', 'Collapse or expand the sidebar'],
    ['?', 'Show shortcuts'],
    ['G then H', 'Go to Home'],
    ['G then C', 'Go to Contracts'],
    ['G then A', 'Go to AI register'],
    ['G then T', 'Go to Tribunal risk'],
    ['G then R', 'Go to Account research'],
    ['G then B', 'Go to Board pack'],
    ['Esc', 'Close any panel or dialog'],
  ];
  return (
    <div className="grid gap-x-8 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map(([k, l]) => (
        <div key={k} className="flex items-center justify-between gap-3 border-b border-secondary py-2 text-sm text-tertiary">
          <span>{l}</span>
          <kbd className="rounded border border-secondary bg-secondary px-1.5 font-body text-xs whitespace-nowrap text-secondary">{k}</kbd>
        </div>
      ))}
      <div className="flex items-center justify-between gap-3 border-b border-secondary py-2 text-sm text-tertiary">
        <span>Hidden tips</span>
        <Button
          color="secondary"
          size="sm"
          onPress={() => {
            showTips();
            toast('Tips are back', 'Each page shows its tip again.');
          }}
        >
          Show tips again
        </Button>
      </div>
      <div className="flex items-center justify-between gap-3 border-b border-secondary py-2 text-sm text-tertiary">
        <span>Demo data</span>
        <Button color="secondary-destructive" size="sm" onPress={() => setOverlay({ resetConfirmOpen: true })}>
          Reset demo
        </Button>
      </div>
    </div>
  );
}

export function Tray() {
  const ui = useKeel((s) => s.ui);
  const clickTab = useKeel((s) => s.clickTrayTab);
  const setTray = useKeel((s) => s.setTray);
  const alerts = useAlerts();
  const mobile = useIsMobileNav();
  const open = ui.trayOpen;

  return (
    <section
      aria-label="Workbench"
      className={cx(
        'z-40 flex flex-col border-t border-secondary bg-primary shadow-[0_-4px_12px_-6px_rgb(0_0_0/0.08)] transition-[height] duration-200 ease-out',
        mobile ? 'fixed inset-x-0 bottom-0 pb-[env(safe-area-inset-bottom)]' : 'absolute inset-x-0 bottom-0',
        mobile && open && 'rounded-t-2xl',
      )}
      style={{ height: open ? (mobile ? '70dvh' : 'var(--tray-open)') : mobile ? 'calc(var(--tray-h) + env(safe-area-inset-bottom))' : 'var(--tray-h)' }}
    >
      <div className="flex h-(--tray-h) shrink-0 items-center gap-1 px-2 sm:px-3">
        <div role="tablist" aria-label="Workbench tabs" className="flex items-center gap-1">
          {TABS.map((t) => {
            const selected = open && ui.trayTab === t.id;
            return (
              <Tooltip key={t.id} content={t.label} disabled={!mobile} placement="top">
                <button
                  type="button"
                  role="tab"
                  id={`tray-tab-${t.id}`}
                  aria-selected={selected}
                  aria-controls={selected ? 'tray-panel' : undefined}
                  aria-label={mobile ? t.label + (t.id === 'alerts' && alerts.length ? `, ${alerts.length}` : '') : undefined}
                  onClick={() => clickTab(t.id)}
                  className={cx(
                    'flex h-9 min-w-10 items-center justify-center gap-1.5 rounded-md px-2.5 text-sm font-semibold text-tertiary transition-colors hover:bg-primary_hover hover:text-secondary',
                    selected && 'bg-tertiary text-primary hover:bg-tertiary',
                  )}
                >
                  <t.Icon className="size-4 shrink-0" aria-hidden />
                  {!mobile && <span>{t.label}</span>}
                  {t.id === 'alerts' && alerts.length > 0 && (
                    <span className="rounded-full bg-brand-solid px-1.5 text-xs leading-[18px] font-semibold text-white" aria-hidden={mobile}>
                      {alerts.length}
                    </span>
                  )}
                </button>
              </Tooltip>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs text-quaternary">
          {!mobile && (
            <>
              <Tooltip content="Demo data is stored in this browser only">
                <span tabIndex={0} className="inline-flex items-center gap-1.5 rounded">
                  <span className="size-2 rounded-full bg-fg-success-secondary ring-3 ring-utility-green-100" aria-hidden />
                  Demo workspace
                </span>
              </Tooltip>
              <span className="hidden lg:inline">
                Press <kbd className="rounded border border-secondary bg-secondary px-1 font-body">`</kbd> to toggle
              </span>
            </>
          )}
          <Tooltip content={open ? 'Close the workbench' : 'Open the workbench'} kbd="`" placement="top">
            <Button
              color="tertiary"
              size="sm"
              iconLeading={open ? ChevronDown : ChevronUp}
              aria-label={open ? 'Close the workbench' : 'Open the workbench'}
              aria-expanded={open}
              onPress={() => setTray(!open)}
              className="size-9 justify-center"
            />
          </Tooltip>
        </div>
      </div>
      {open && (
        <div id="tray-panel" role="tabpanel" aria-labelledby={`tray-tab-${ui.trayTab}`} className="min-h-0 flex-1 overflow-y-auto border-t border-secondary">
          {ui.trayTab === 'activity' && <ActivityTab />}
          {ui.trayTab === 'alerts' && <AlertsTab onOpen={() => mobile && setTray(false)} />}
          {ui.trayTab === 'ask' && <AskTab />}
          {ui.trayTab === 'shortcuts' && <ShortcutsTab />}
        </div>
      )}
    </section>
  );
}

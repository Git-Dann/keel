'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { CheckCircle, SearchLg, Upload01 } from '@untitledui/icons';
import { cx } from '@/utils/cx';
import { Button } from '@/components/ui/untitled/base/buttons/button';
import { Card, CardHeader, EmptyState, HelperBanner, PageHeader } from '@/components/ui/Primitives';
import { useAlerts, useKeel } from '@/lib/store';
import { useOverlay } from '@/lib/ui-store';
import { horizonEvents } from '@/lib/logic/horizon';
import { contractStatus } from '@/lib/logic/contracts';
import { assess } from '@/lib/logic/tribunal';
import { problemSources } from '@/lib/logic/board';
import { MODULES } from '@/lib/modules';
import { fmtDay, plural, rel } from '@/lib/format';
import type { ModuleId } from '@/lib/types';
import { Horizon } from './Horizon';

function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function ToolCard({ id, value, label, status }: { id: ModuleId; value: number; label: string; status: string }) {
  const m = MODULES[id];
  return (
    <Link
      href={m.href}
      className="group flex min-w-0 flex-col gap-3 rounded-xl border border-secondary bg-primary p-5 shadow-xs transition-colors hover:border-primary"
    >
      <span className={cx('grid size-10 place-items-center rounded-lg text-white', m.bg)} aria-hidden>
        <m.Icon className="size-5" />
      </span>
      <span>
        <span className="block font-head text-[40px] leading-none text-primary">{value}</span>
        <span className="mt-1 block text-sm text-tertiary">{label}</span>
      </span>
      <span className="text-sm font-medium text-secondary">{status}</span>
      <span className="sr-only">Open {m.label}</span>
    </Link>
  );
}

export function HomePage() {
  const data = useKeel((s) => s.data);
  const alerts = useAlerts();
  const setOverlay = useOverlay((s) => s.set);
  const events = useMemo(() => horizonEvents(data), [data]);
  const urgentHrefs = useMemo(() => new Set(alerts.map((a) => a.href)), [alerts]);
  const worst = alerts.slice(0, 6);

  const stats = useMemo(() => {
    const st = data.contracts.map((c) => contractStatus(c));
    const live = st.filter((s) => s !== 'expired').length;
    const due = st.filter((s) => s === 'due').length;
    const highAi = data.ai.filter((a) => a.tier === 'high' || a.tier === 'prohibited').length;
    const highCases = data.cases.filter((c) => assess(c, data.settings.qualifyingMonths).level === 'high').length;
    const unbriefed = data.prospects.filter((p) => p.briefedDaysAgo == null).length;
    const probs = problemSources(data.board).length;
    return { live, due, highAi, highCases, unbriefed, probs };
  }, [data]);

  return (
    <>
      <PageHeader
        title={`${greeting()}, Dan`}
        sub={
          alerts.length
            ? `${plural(alerts.length, 'thing')} ${alerts.length === 1 ? 'needs' : 'need'} you. The worst ${worst.length} ${worst.length === 1 ? 'is' : 'are'} below. The horizon shows everything else coming up in the next 90 days.`
            : 'Nothing needs you right now. The horizon shows what is coming up.'
        }
        actions={
          <>
            <Button color="secondary" size="md" iconLeading={SearchLg} onPress={() => setOverlay({ paletteOpen: true })}>
              Jump to
            </Button>
            <Button color="primary" size="md" iconLeading={Upload01} onPress={() => setOverlay({ uploadOpen: true })}>
              Upload contract
            </Button>
          </>
        }
      />
      <HelperBanner id="home" title="This is your horizon">
        Every deadline from all five tools sits on one timeline, a row per tool, so a contract notice, a tribunal hearing and the board pack never surprise you. Ringed dots need you now. Hover a dot for detail, click to open it.
      </HelperBanner>

      <Horizon events={events} urgentHrefs={urgentHrefs} />

      <div className="grid gap-6 split:grid-cols-[2fr_1fr]">
        <Card aria-labelledby="needs-title">
          <CardHeader id="needs-title" title="Needs you" sub="Sorted by risk, worst first" />
          {worst.length ? (
            <ul className="divide-y divide-secondary">
              {worst.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-5 py-4">
                  <span className={cx('mt-1.5 size-2 shrink-0 rounded-full', a.severity === 'error' ? 'bg-fg-error-secondary' : 'bg-fg-warning-secondary')} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold break-words text-primary">
                      <span className="sr-only">{a.severity === 'error' ? 'Urgent: ' : 'Warning: '}</span>
                      {a.title}
                    </p>
                    <p className="text-sm text-tertiary">{a.detail}</p>
                  </div>
                  <Button href={a.href} color="secondary" size="sm" aria-label={`Open: ${a.title}`} className="min-h-9">
                    Open
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={CheckCircle} title="All clear">
              Nothing urgent. Keel will flag the next deadline as it gets close.
            </EmptyState>
          )}
        </Card>

        <Card aria-labelledby="next-title">
          <CardHeader id="next-title" title="Up next" sub="The next five deadlines" />
          {events.length ? (
            <ul className="divide-y divide-secondary">
              {events.slice(0, 5).map((e) => (
                <li key={e.id}>
                  <Link href={e.href} className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-primary_hover">
                    <span className={cx('mt-1.5 size-2 shrink-0 rounded-full', MODULES[e.module].bg)} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-primary" title={e.title}>
                        {e.title}
                      </span>
                      <span className="block text-sm text-tertiary">
                        {fmtDay(e.day)}, {rel(e.day)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={CheckCircle} title="Nothing in the next 90 days">
              Add a contract or a case and its deadlines appear here.
            </EmptyState>
          )}
        </Card>
      </div>

      <h2 className="mt-8 mb-4 text-lg font-semibold text-primary">Your tools</h2>
      <div className="grid grid-cols-1 gap-4 min-[30rem]:grid-cols-2 split:grid-cols-5">
        <ToolCard id="contracts" value={stats.live} label="live contracts" status={`${plural(stats.due, 'notice')} due`} />
        <ToolCard id="ai" value={data.ai.length} label="AI tools in use" status={`${stats.highAi} high risk or banned`} />
        <ToolCard id="tribunal" value={data.cases.length} label="open HR cases" status={`${stats.highCases} high risk`} />
        <ToolCard id="accounts" value={data.prospects.length} label="target accounts" status={`${stats.unbriefed} not briefed yet`} />
        <ToolCard
          id="board"
          value={data.board.meetingInDays}
          label="days to the board"
          status={stats.probs ? `${plural(stats.probs, 'source')} ${stats.probs === 1 ? 'needs' : 'need'} fixing` : 'All data fresh'}
        />
      </div>
    </>
  );
}

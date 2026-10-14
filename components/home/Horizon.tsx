'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { addDays } from 'date-fns';
import { cx } from '@/utils/cx';
import { Card, CardHeader } from '@/components/ui/Primitives';
import { Tooltip } from '@/components/ui/Tooltip';
import { MODULES, MODULE_ORDER } from '@/lib/modules';
import { HORIZON_DAYS, weekTicks } from '@/lib/logic/horizon';
import { fmtDay, fmtShort, rel, today } from '@/lib/format';
import type { HorizonEvent } from '@/lib/types';

const pct = (day: number) => `${(day / HORIZON_DAYS) * 100}%`;

/**
 * The Horizon: one quiet row per tool across the next 90 days.
 * Position carries the meaning, so dots never stack. Deadlines behind an
 * open alert get a ring in their tool's colour.
 */
export function Horizon({ events, urgentHrefs }: { events: HorizonEvent[]; urgentHrefs: Set<string> }) {
  const base = today();
  const rows = useMemo(() => MODULE_ORDER.map((id) => ({ id, events: events.filter((e) => e.module === id) })), [events]);
  const tools = rows.filter((r) => r.events.length).length;
  const urgent = events.filter((e) => urgentHrefs.has(e.href)).length;

  return (
    <Card className="mb-6" aria-labelledby="horizon-title">
      <CardHeader
        id="horizon-title"
        title="Next 90 days"
        help="Every deadline from all five tools, one row per tool. A ringed dot needs you now. Hover a dot for detail, click to open it."
        sub={`${events.length} ${events.length === 1 ? 'deadline' : 'deadlines'} across ${tools} ${tools === 1 ? 'tool' : 'tools'}${urgent ? `, ${urgent} ${urgent === 1 ? 'needs' : 'need'} you now` : ''}`}
        right={
          <span className="text-sm text-tertiary">
            {fmtShort(base)} to {fmtShort(addDays(base, HORIZON_DAYS))}
          </span>
        }
      />
      <div className="py-4">
        <div className="overflow-x-auto overscroll-x-contain" tabIndex={-1}>
          <div role="group" aria-label="Deadlines in the next 90 days" className="flex min-w-[760px]">
            {/* Row labels stay put while the track scrolls on small screens. */}
            <div className="sticky left-0 z-10 w-44 shrink-0 bg-primary pt-6 pb-7 pl-5 sm:w-48">
              {rows.map((r) => (
                <div key={r.id} className="flex h-10 items-center gap-2 text-sm">
                  <span className={cx('size-2 shrink-0 rounded-full', MODULES[r.id].bg)} aria-hidden />
                  <span className="truncate font-medium text-secondary">{MODULES[r.id].label}</span>
                  <span className="hidden text-quaternary tabular-nums sm:inline">{r.events.length}</span>
                </div>
              ))}
            </div>

            <div className="relative min-w-0 flex-1 pt-6 pr-6 pb-7 pl-2">
              <div className="relative">
                {/* Weekly gridlines with dates underneath. */}
                {weekTicks().map((d) => (
                  <div key={d} className="absolute top-0 bottom-0 border-l border-dashed border-secondary" style={{ left: pct(d) }} aria-hidden>
                    <span className="absolute top-full mt-2 -translate-x-1/2 text-xs whitespace-nowrap text-quaternary">{fmtDay(d, base)}</span>
                  </div>
                ))}
                <div className="absolute -top-1 -bottom-1 left-0 w-0.5 -translate-x-1/2 rounded-full bg-fg-brand-primary" aria-hidden>
                  <span className="absolute -top-5 left-1.5 text-xs font-semibold whitespace-nowrap text-brand-secondary">Today</span>
                </div>

                {rows.map((r) => {
                  const m = MODULES[r.id];
                  return (
                    <ul key={r.id} aria-label={`${m.label} deadlines`} className="relative h-10">
                      <li className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-border-secondary" aria-hidden />
                      {r.events.map((e) => {
                        const isUrgent = urgentHrefs.has(e.href);
                        return (
                          <li key={e.id} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: pct(e.day) }}>
                            <Tooltip title={e.title} content={`${e.detail} · ${fmtDay(e.day, base)} (${rel(e.day)})${isUrgent ? ' · Needs you now' : ''}`}>
                              <Link
                                href={e.href}
                                aria-label={`${e.title}. ${e.detail}. ${fmtDay(e.day, base)}, ${rel(e.day)}.${isUrgent ? ' Needs you now.' : ''}`}
                                className="group grid size-7 place-items-center rounded-full"
                              >
                                <span
                                  className={cx(
                                    'block rounded-full transition-transform group-hover:scale-125 group-focus-visible:scale-125',
                                    m.bg,
                                    isUrgent ? cx('size-3 ring-2 ring-offset-2 ring-offset-bg-primary', m.ring) : 'size-2.5',
                                  )}
                                  aria-hidden
                                />
                              </Link>
                            </Tooltip>
                          </li>
                        );
                      })}
                    </ul>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 px-5 text-sm text-tertiary" aria-label="Key">
          <li className="inline-flex items-center gap-2">
            <span className="size-3 rounded-full bg-fg-quaternary ring-2 ring-fg-quaternary ring-offset-2 ring-offset-bg-primary" aria-hidden />
            Needs you now
          </li>
          <li className="inline-flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-fg-quaternary" aria-hidden />
            Coming up
          </li>
        </ul>
      </div>
    </Card>
  );
}

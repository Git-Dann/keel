'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { addDays } from 'date-fns';
import { cx } from '@/utils/cx';
import { Card, CardHeader } from '@/components/ui/Primitives';
import { Tooltip } from '@/components/ui/Tooltip';
import { MODULES, MODULE_ORDER } from '@/lib/modules';
import { assignLanes, HORIZON_DAYS, weekTicks } from '@/lib/logic/horizon';
import { fmtDay, fmtShort, rel, today } from '@/lib/format';
import type { HorizonEvent } from '@/lib/types';

const LANE_TOP = ['50%', '22%', '78%'] as const; // middle, above, below
const pct = (day: number) => `${(day / HORIZON_DAYS) * 100}%`;

export function Horizon({ events }: { events: HorizonEvent[] }) {
  const lanes = useMemo(() => assignLanes(events), [events]);
  const tools = new Set(events.map((e) => e.module)).size;
  const base = today();

  return (
    <Card className="mb-6" aria-labelledby="horizon-title">
      <CardHeader
        id="horizon-title"
        title="Next 90 days"
        help="Every deadline from all five tools on one line. Dots stack when deadlines fall close together. Colours match the tool they come from."
        sub={`${events.length} ${events.length === 1 ? 'deadline' : 'deadlines'} across ${tools} ${tools === 1 ? 'tool' : 'tools'}`}
        right={
          <span className="text-sm text-tertiary">
            {fmtShort(base)} to {fmtShort(addDays(base, HORIZON_DAYS))}
          </span>
        }
      />
      <div className="px-5 pt-6 pb-5">
        <div className="-mx-5 overflow-x-auto overscroll-x-contain px-5 pb-1" tabIndex={-1}>
          <div className="relative h-[176px] min-w-[760px]">
            {/* Track area leaves room at both ends so edge dots are not clipped. */}
            <div className="absolute inset-x-4 top-6 bottom-7">
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border-secondary" aria-hidden />
              {weekTicks().map((d) => (
                <div key={d} className="absolute top-0 bottom-0 border-l border-dashed border-secondary" style={{ left: pct(d) }} aria-hidden>
                  <span className="absolute top-full mt-1.5 -translate-x-1/2 text-xs whitespace-nowrap text-quaternary">{fmtDay(d, base)}</span>
                </div>
              ))}
              <div className="absolute -top-1 -bottom-1 left-0 w-0.5 -translate-x-1/2 rounded-full bg-fg-brand-primary" aria-hidden>
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold text-brand-secondary">Today</span>
              </div>
              <ol aria-label="Deadlines in the next 90 days" className="absolute inset-0">
                {events.map((e, i) => {
                  const m = MODULES[e.module];
                  const label = `${e.title}. ${e.detail}. ${fmtDay(e.day, base)}, ${rel(e.day)}.`;
                  return (
                    <li key={e.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pct(e.day), top: LANE_TOP[lanes[i]] }}>
                      <Tooltip title={e.title} content={`${e.detail} · ${fmtDay(e.day, base)} (${rel(e.day)})`}>
                        <Link
                          href={e.href}
                          aria-label={label}
                          className={cx(
                            'grid size-7 place-items-center rounded-full shadow-sm ring-2 ring-bg-primary transition-transform hover:scale-115 focus-visible:scale-115',
                            m.bg,
                          )}
                        >
                          <m.Icon className="size-3.5 text-white" aria-hidden />
                        </Link>
                      </Tooltip>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-tertiary" aria-label="Legend">
          {MODULE_ORDER.map((id) => (
            <li key={id} className="inline-flex items-center gap-2">
              <span className={cx('size-2.5 rounded-full', MODULES[id].bg)} aria-hidden />
              {MODULES[id].label}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

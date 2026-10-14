import type { HorizonEvent, WorkspaceData } from '../types';
import { daysUntil, money, today } from '../format';
import { noticeBy } from './contracts';
import { TIER_META } from './ai';
import { PACK_DUE_DAYS_BEFORE, problemSources } from './board';

export const HORIZON_DAYS = 90;
const inRange = (n: number) => n >= 0 && n <= HORIZON_DAYS;

export function horizonEvents(d: WorkspaceData, base: Date = today()): HorizonEvent[] {
  const ev: HorizonEvent[] = [];
  for (const c of d.contracts) {
    const nb = noticeBy(c);
    const nbDay = nb ? daysUntil(nb, base) : null;
    if (c.autoRenews && nbDay != null && inRange(nbDay)) {
      ev.push({ id: `h-${c.id}`, module: 'contracts', day: nbDay, title: `Notice deadline: ${c.name}`, detail: c.party, href: `/contracts?open=${c.id}` });
    } else if (c.renews && inRange(daysUntil(c.renews, base))) {
      ev.push({ id: `h-${c.id}`, module: 'contracts', day: daysUntil(c.renews, base), title: `Renews: ${c.name}`, detail: c.value == null ? c.party : `${money(c.value)} a year`, href: `/contracts?open=${c.id}` });
    }
  }
  for (const t of d.ai) {
    if (t.tier !== 'minimal' && inRange(t.reviewInDays))
      ev.push({ id: `h-${t.id}`, module: 'ai', day: t.reviewInDays, title: `Review due: ${t.name}`, detail: TIER_META[t.tier].label, href: `/ai?open=${t.id}` });
  }
  for (const c of d.cases) {
    if (inRange(c.stageInDays))
      ev.push({ id: `h-${c.id}`, module: 'tribunal', day: c.stageInDays, title: `${c.stage}: ${c.ref}`, detail: c.kind[0].toUpperCase() + c.kind.slice(1), href: `/tribunal?open=${c.id}` });
  }
  for (const p of d.prospects) {
    if (p.followUpInDays != null && inRange(p.followUpInDays))
      ev.push({ id: `h-${p.id}`, module: 'accounts', day: p.followUpInDays, title: `Follow up: ${p.name}`, detail: `Fit ${p.fit}`, href: `/accounts?open=${p.id}` });
  }
  const m = d.board.meetingInDays;
  const probs = problemSources(d.board).length;
  if (inRange(m)) ev.push({ id: 'h-board', module: 'board', day: m, title: 'Board meeting', detail: `Pack due ${PACK_DUE_DAYS_BEFORE} days before`, href: '/board' });
  const due = m - PACK_DUE_DAYS_BEFORE;
  if (inRange(due))
    ev.push({ id: 'h-pack', module: 'board', day: due, title: 'Board pack due', detail: probs ? `${probs} ${probs === 1 ? 'source needs' : 'sources need'} attention` : 'All sources fresh', href: '/board' });
  return ev.sort((a, b) => a.day - b.day || a.id.localeCompare(b.id));
}

export type Lane = 0 | 1 | 2; // middle, above, below

/**
 * Stack dots that fall within `gap` days of each other onto three lanes
 * (middle, above, below) so none overlap. Events must be sorted by day.
 */
export function assignLanes(events: { day: number }[], gap = 4): Lane[] {
  const last: (number | null)[] = [null, null, null];
  return events.map((e) => {
    let lane = last.findIndex((d) => d == null || e.day - d >= gap);
    if (lane === -1) {
      // All lanes busy: reuse the lane whose last dot is furthest back.
      lane = last.reduce<number>((best, d, i) => ((d ?? -Infinity) < (last[best] ?? -Infinity) ? i : best), 0);
    }
    last[lane] = e.day;
    return lane as Lane;
  });
}

/** Weekly gridlines, as day offsets, excluding today. */
export const weekTicks = (): number[] => Array.from({ length: Math.floor(HORIZON_DAYS / 7) }, (_, i) => (i + 1) * 7);

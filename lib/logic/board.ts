import type { Alert, BoardSection, BoardSource, BoardState } from '../types';

export const problemSources = (b: BoardState): BoardSource[] => b.sources.filter((s) => s.status !== 'ok');

export const sourceDays = (s: BoardSource): number => Math.round((s.hoursSinceSync ?? 0) / 24);

export function syncLabel(s: BoardSource): string {
  if (s.status === 'off' || s.hoursSinceSync == null) return 'Not connected';
  if (s.hoursSinceSync < 1) return 'Synced just now';
  if (s.hoursSinceSync < 24) return `Synced ${s.hoursSinceSync}h ago`;
  const d = sourceDays(s);
  return `Synced ${d} ${d === 1 ? 'day' : 'days'} ago`;
}

export function sourceProblemText(s: BoardSource): string {
  return s.status === 'off' ? `${s.vendor} is disconnected` : `${s.vendor} last synced ${sourceDays(s)} days ago`;
}

export type SectionHealth = 'ok' | 'stale' | 'missing';

export function sectionHealth(section: BoardSection, sources: BoardSource[]): SectionHealth {
  const s = sources.find((x) => x.id === section.source);
  if (!s || s.status === 'ok') return 'ok';
  return s.status === 'off' ? 'missing' : 'stale';
}

export function sectionsAtRisk(b: BoardState): BoardSection[] {
  return b.sections.filter((s) => s.included && sectionHealth(s, b.sources) !== 'ok');
}

export function sectionSourceLabel(section: BoardSection, sources: BoardSource[]): string {
  const s = sources.find((x) => x.id === section.source);
  if (s) return `From ${s.vendor}`;
  if (section.source === 'keel') return 'From Keel: contracts, AI and HR risk';
  return 'You write this';
}

/** Draft paragraph for a section, which changes once sources are synced or connected. */
export function draftText(sectionId: string, b: BoardState, alerts: Alert[]): string {
  const src = (id: string) => b.sources.find((s) => s.id === id);
  switch (sectionId) {
    case 's1':
      return 'Revenue grew 6.2% on the previous month to £386k, the fourth month of growth in a row. Net burn fell to £128k, extending runway to 19 months.';
    case 's2':
      return 'Weighted pipeline dipped 3% to £2.4m as two enterprise deals slipped into next quarter. Win rate held at 27%.';
    case 's3': {
      const s = src('linear');
      if (!s || s.status === 'ok')
        return 'Three of four roadmap milestones are on track. Two releases shipped this month and the mobile app beta opened to 40 customers.';
      if (s.status === 'off') return 'No delivery data this month. The delivery tool is not connected.';
      return `Delivery data is ${sourceDays(s)} days old, so these figures may be out of date. The last sync showed 3 of 4 roadmap milestones on track.`;
    }
    case 's4': {
      const s = src('bamboohr');
      if (!s || s.status === 'ok') return 'Headcount is 64 after 3 starters and 1 leaver. Four roles are open, two of them in engineering.';
      if (s.status === 'stale') return `People data is ${sourceDays(s)} days old. The last sync showed headcount of 63 with four roles open.`;
      return 'No people data this month. The HR system is not connected.';
    }
    case 's5': {
      const risks = alerts.filter((a) => a.module !== 'board').slice(0, 5);
      return risks.length ? risks.map((r) => r.title).join('. ') + '.' : 'No open risks this month.';
    }
    case 's6':
      return 'Approve the revised hiring plan. Agree the approach to the Northwind CRM renewal.';
    default:
      return '';
  }
}

export const PACK_DUE_DAYS_BEFORE = 5;

import type { WorkspaceData } from '../types';
import { contractStatus, CONTRACT_STATUS } from './contracts';
import { TIER_META } from './ai';
import { assess, LEVEL_META } from './tribunal';
import { problemSources } from './board';
import { daysUntil, fmtShort, rel, today } from '../format';

export interface Answer {
  text: string;
  items?: string[];
}

export const SUGGESTED_QUESTIONS = ['What renews this month?', 'Which AI tools are risky?', 'Any high-risk HR cases?', 'Is the board pack ready?'];

export const FALLBACK = 'I can only answer from this workspace. Try asking about renewals, AI tools, HR cases, prospects or the board pack.';

/** Keyword matching over workspace data only. No AI calls. */
export function answer(question: string, d: WorkspaceData, base: Date = today()): Answer {
  const t = question.toLowerCase();

  if (/\b(hr|tribunal|dismiss\w*|cases?|grievances?|employees?|disciplinary)\b/.test(t)) {
    const rows = d.cases.map((c) => ({ c, a: assess(c, d.settings.qualifyingMonths) }));
    if (!rows.length) return { text: 'There are no open HR cases.' };
    const high = rows.filter((r) => r.a.level === 'high');
    const pick = /high/.test(t) ? high : rows;
    if (!pick.length) return { text: 'No HR cases are high risk right now.' };
    return {
      text: /high/.test(t) ? `${pick.length} ${pick.length === 1 ? 'case is' : 'cases are'} high risk:` : `${pick.length} open cases:`,
      items: pick.map(({ c, a }) => {
        const n = a.flags.filter((f) => f.severity !== 'success').length;
        return `${c.ref}: ${LEVEL_META[a.level].label.toLowerCase()}, ${n} ${n === 1 ? 'issue' : 'issues'} to fix`;
      }),
    };
  }

  if (/\b(renew\w*|notice|contracts?|supplier|expir\w*)\b/.test(t)) {
    const month = /month/.test(t);
    const rows = d.contracts
      .map((c) => ({ c, st: contractStatus(c, base) }))
      .filter(({ c, st }) => {
        if (!c.renews) return false;
        if (month) {
          const r = daysUntil(c.renews, base);
          return r >= 0 && r <= 31;
        }
        return ['due', 'locked', 'upcoming'].includes(st);
      });
    if (!rows.length) return { text: month ? 'Nothing renews in the next month.' : 'Nothing renews in the next 90 days.' };
    return {
      text: month ? `${rows.length} ${rows.length === 1 ? 'contract renews' : 'contracts renew'} in the next month:` : `${rows.length} contracts are coming up:`,
      items: rows.map(({ c, st }) => `${c.name}: ${CONTRACT_STATUS[st].label.toLowerCase()}, renews ${fmtShort(c.renews!)}`),
    };
  }

  if (/\b(ai|risky|prohibited|banned|register|tools?|shadow)\b/.test(t)) {
    const rows = d.ai.filter((a) => ['prohibited', 'high', 'unassessed'].includes(a.tier));
    if (!rows.length) return { text: 'No AI tools are prohibited, high risk or unassessed.' };
    return {
      text: `${rows.length} AI ${rows.length === 1 ? 'tool needs' : 'tools need'} work:`,
      items: rows.map((a) => `${a.name}: ${TIER_META[a.tier].label.toLowerCase()}, paperwork ${a.paperwork}%`),
    };
  }

  if (/\b(board|pack|meeting|directors?)\b/.test(t)) {
    const s = problemSources(d.board);
    const when = `The board meets ${rel(d.board.meetingInDays)}.`;
    if (!s.length) return { text: `${when} All sources are fresh, so the pack is ready to build.` };
    return {
      text: `${when} Not ready yet:`,
      items: s.map((x) => `${x.vendor} is ${x.status === 'off' ? 'disconnected' : 'stale'}`),
    };
  }

  if (/\b(prospects?|brief\w*|accounts?|sales|leads?|fit)\b/.test(t)) {
    if (!d.prospects.length) return { text: 'There are no target accounts yet.' };
    const best = [...d.prospects].sort((a, b) => b.fit - a.fit)[0];
    const unbriefed = d.prospects.filter((p) => p.briefedDaysAgo == null).length;
    return { text: `Your best-fit account is ${best.name} (fit ${best.fit}). ${unbriefed} ${unbriefed === 1 ? 'account has' : 'accounts have'} no briefing yet.` };
  }

  return { text: FALLBACK };
}

import type { Prospect } from '../types';

export const normaliseQuery = (q: string) =>
  q.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');

export type SearchResult =
  | { kind: 'empty' }
  | { kind: 'short' }
  | { kind: 'exact'; prospect: Prospect }
  | { kind: 'suggest'; query: string; matches: Prospect[] };

export function searchProspects(raw: string, all: Prospect[]): SearchResult {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: 'empty' };
  const q = normaliseQuery(trimmed);
  if (q.length < 2) return { kind: 'short' };
  const exact = all.find((p) => p.name.toLowerCase() === q || p.domain.toLowerCase() === q);
  if (exact) return { kind: 'exact', prospect: exact };
  const matches = all.filter((p) => {
    const name = p.name.toLowerCase();
    return name.includes(q) || p.domain.includes(q) || name.split(/[^a-z0-9]+/).some((w) => w.length > 2 && q.includes(w));
  });
  return { kind: 'suggest', query: trimmed.replace(/^https?:\/\//i, '').replace(/^www\./i, ''), matches };
}

export type FitBand = 'strong' | 'reasonable' | 'weak';
export const fitBand = (fit: number): FitBand => (fit >= 80 ? 'strong' : fit >= 65 ? 'reasonable' : 'weak');
export const FIT_TONE: Record<FitBand, 'success' | 'blue' | 'gray'> = { strong: 'success', reasonable: 'blue', weak: 'gray' };
export const FIT_TIP = 'Fit compares the company with your best customers on size, sector and buying signals. 80 or more is a strong fit.';

export function oneLiner(p: Prospect): string {
  const size = p.size === 'Size unknown' ? 'company of unknown size' : `${p.size} ${p.sector === 'Sector unknown' ? 'company' : p.sector.toLowerCase() + ' business'}`;
  const sig = p.signals.length ? ` showing ${p.signals.length} buying ${p.signals.length === 1 ? 'signal' : 'signals'} in the last 90 days` : '';
  const band = fitBand(p.fit);
  const tail =
    band === 'strong' ? 'Strong fit with your best customers.' : band === 'reasonable' ? 'Reasonable fit, worth a tailored approach.' : 'Weaker fit, so qualify early.';
  return `${p.name} is a ${size}${sig}. ${tail}`;
}

const lowerFirst = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);

export function openers(p: Prospect): string[] {
  const out: string[] = [];
  const [a, b] = p.signals;
  if (a) out.push(`Saw that ${lowerFirst(a.text)}. How is that changing what your ops team is focused on this quarter?`);
  if (b) out.push(`Noticed ${lowerFirst(b.text)}. Teams at that stage often find contracts and compliance work piles up. Is that true for you?`);
  const sector = p.sector === 'Sector unknown' ? 'growing' : p.sector.toLowerCase();
  out.push(`We work with a few ${sector} firms around your size. Would a 20-minute look at how they handle renewals be useful?`);
  return out;
}

export function newThinProspect(id: string, name: string): Prospect {
  const clean = name.trim();
  return {
    id,
    name: clean,
    domain: (clean.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'company') + '.example',
    sector: 'Sector unknown',
    size: 'Size unknown',
    fit: 40,
    briefedDaysAgo: null,
    followUpInDays: 30,
    filings: null,
    signals: [],
    risk: 'Very little public information. Confirm the basics on the first call.',
    thinData: true,
  };
}

export function briefingText(p: Prospect): string {
  return [
    `${p.name} (${p.sector}, ${p.size}, ${p.domain})`,
    '',
    `In one line: ${oneLiner(p)}`,
    `Financials: ${p.filings ?? 'No accounts filed yet.'}`,
    `Signals: ${p.signals.map((s) => `${s.kind}: ${s.text}`).join('; ') || 'None found'}`,
    `Watch out for: ${p.risk}`,
    '',
    'Suggested openers:',
    ...openers(p).map((o) => `- ${o}`),
    '',
    'Demo data. Companies are fictional.',
  ].join('\n');
}

export const BRIEFING_STEPS = ['Reading filings', 'Scanning news', 'Checking job boards', 'Writing the briefing'];

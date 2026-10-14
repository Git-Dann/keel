import { describe, expect, it } from 'vitest';
import { briefingText, fitBand, newThinProspect, normaliseQuery, oneLiner, openers, searchProspects } from '@/lib/logic/accounts';
import { seedProspects } from '@/lib/seed';

const all = seedProspects();

describe('search', () => {
  it('empty and short', () => {
    expect(searchProspects('   ', all).kind).toBe('empty');
    expect(searchProspects('h', all).kind).toBe('short');
  });
  it('strips scheme and www', () => {
    expect(normaliseQuery(' https://www.Harlowfinch.example/about ')).toBe('harlowfinch.example');
    const r = searchProspects('https://www.harlowfinch.example', all);
    expect(r.kind === 'exact' && r.prospect.id).toBe('p1');
  });
  it('exact name match', () => {
    const r = searchProspects('Orbitex Logistics', all);
    expect(r.kind === 'exact' && r.prospect.id).toBe('p2');
  });
  it('partial match suggests', () => {
    const r = searchProspects('Harlow', all);
    expect(r.kind).toBe('suggest');
    if (r.kind === 'suggest') expect(r.matches.map((p) => p.id)).toEqual(['p1']);
  });
  it('no match still offers build anyway', () => {
    const r = searchProspects('Quayside Foods', all);
    expect(r).toEqual({ kind: 'suggest', query: 'Quayside Foods', matches: [] });
  });
});

describe('briefings', () => {
  it('fit bands', () => {
    expect(fitBand(86)).toBe('strong');
    expect(fitBand(72)).toBe('reasonable');
    expect(fitBand(40)).toBe('weak');
  });
  it('one liner uses size, sector, signals and fit', () => {
    expect(oneLiner(all[0])).toBe('Harlow & Finch is a 320 staff legal services business showing 3 buying signals in the last 90 days. Strong fit with your best customers.');
    expect(oneLiner(newThinProspect('x', 'Quayside Foods'))).toBe('Quayside Foods is a company of unknown size. Weaker fit, so qualify early.');
  });
  it('openers from first two signals plus sector', () => {
    expect(openers(all[0])).toHaveLength(3);
    expect(openers(all[0])[0]).toMatch(/^Saw that 6 legal ops roles/);
    expect(openers(newThinProspect('x', 'Q'))).toHaveLength(1);
  });
  it('thin prospect', () => {
    expect(newThinProspect('x', ' Quayside Foods ')).toMatchObject({ name: 'Quayside Foods', domain: 'quaysidefoods.example', fit: 40, thinData: true, filings: null });
  });
  it('copy text', () => {
    expect(briefingText(all[3])).toMatch(/No accounts filed yet/);
    expect(briefingText(newThinProspect('x', 'Q'))).toMatch(/Signals: None found/);
  });
});

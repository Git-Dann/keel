import { describe, expect, it } from 'vitest';
import { draftText, problemSources, sectionHealth, sectionSourceLabel, sectionsAtRisk, sourceProblemText, syncLabel } from '@/lib/logic/board';
import { seedBoard } from '@/lib/seed';
import type { Alert, BoardState } from '@/lib/types';

const fresh = (): BoardState => {
  const b = seedBoard();
  b.sources = b.sources.map((s) => ({ ...s, status: 'ok', hoursSinceSync: 0 }));
  return b;
};

describe('board readiness', () => {
  it('finds stale and disconnected sources', () => {
    expect(problemSources(seedBoard()).map((s) => s.id)).toEqual(['linear', 'bamboohr']);
    expect(problemSources(fresh())).toEqual([]);
  });
  it('labels sources', () => {
    const [xero, , linear, bamboo] = seedBoard().sources;
    expect(syncLabel(xero)).toBe('Synced 2h ago');
    expect(syncLabel(linear)).toBe('Synced 9 days ago');
    expect(syncLabel(bamboo)).toBe('Not connected');
    expect(syncLabel({ ...xero, hoursSinceSync: 0 })).toBe('Synced just now');
    expect(syncLabel({ ...xero, hoursSinceSync: 24 })).toBe('Synced 1 day ago');
    expect(sourceProblemText(linear)).toBe('Linear last synced 9 days ago');
    expect(sourceProblemText(bamboo)).toBe('BambooHR is disconnected');
  });
  it('section health follows its source', () => {
    const b = seedBoard();
    expect(b.sections.map((s) => sectionHealth(s, b.sources))).toEqual(['ok', 'ok', 'stale', 'missing', 'ok', 'ok']);
    expect(sectionsAtRisk(b).map((s) => s.id)).toEqual(['s3', 's4']);
    b.sections[2].included = false;
    expect(sectionsAtRisk(b).map((s) => s.id)).toEqual(['s4']);
    expect(sectionsAtRisk(fresh())).toEqual([]);
  });
  it('source labels', () => {
    const b = seedBoard();
    expect(sectionSourceLabel(b.sections[0], b.sources)).toBe('From Xero');
    expect(sectionSourceLabel(b.sections[4], b.sources)).toMatch(/From Keel/);
    expect(sectionSourceLabel(b.sections[5], b.sources)).toBe('You write this');
  });
  it('draft text changes once sources are fixed', () => {
    const b = seedBoard();
    expect(draftText('s3', b, [])).toMatch(/9 days old/);
    expect(draftText('s4', b, [])).toMatch(/not connected/);
    const f = fresh();
    expect(draftText('s3', f, [])).toMatch(/Three of four/);
    expect(draftText('s4', f, [])).toMatch(/Headcount is 64/);
    f.sources[2].status = 'off';
    expect(draftText('s3', f, [])).toMatch(/not connected/);
    f.sources[3] = { ...f.sources[3], status: 'stale', hoursSinceSync: 48 };
    expect(draftText('s4', f, [])).toMatch(/2 days old/);
    expect(draftText('s1', b, [])).toMatch(/£386k/);
    expect(draftText('s2', b, [])).toMatch(/£2.4m/);
    expect(draftText('s6', b, [])).toMatch(/Approve/);
    expect(draftText('zz', b, [])).toBe('');
  });
  it('risk register comes from non-board alerts', () => {
    const alerts: Alert[] = [
      { id: '1', severity: 'error', module: 'contracts', title: 'A', detail: '', href: '' },
      { id: '2', severity: 'warning', module: 'board', title: 'B', detail: '', href: '' },
    ];
    expect(draftText('s5', seedBoard(), alerts)).toBe('A.');
    expect(draftText('s5', seedBoard(), [])).toBe('No open risks this month.');
  });
});

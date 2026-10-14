import { describe, expect, it } from 'vitest';
import { assess, blankDraft, draftFromCase, levelFor, nextRef, serviceOf, validateDraft } from '@/lib/logic/tribunal';
import { seedCases } from '@/lib/seed';
import type { CaseAnswers, CaseKind } from '@/lib/types';

const clean: CaseAnswers = { investigation: 'yes', invite: 'yes', evidence: 'yes', warnings: 'yes', appeal: 'yes', consistent: 'yes', protected: 'none' };
const run = (a: Partial<CaseAnswers>, kind: CaseKind = 'conduct', months = 36, q = 24) =>
  assess({ kind, serviceMonths: months, answers: { ...clean, ...a } }, q);
const titles = (r: ReturnType<typeof assess>) => r.flags.map((f) => f.title);

describe('assess', () => {
  it('no flags means sound', () => {
    const r = run({});
    expect(r.score).toBe(0);
    expect(r.level).toBe('low');
    expect(r.flags).toEqual([expect.objectContaining({ severity: 'success', title: 'Process looks sound' })]);
  });
  it('protected reason +40', () => {
    for (const [p, label] of [['discrimination', 'a discrimination complaint'], ['whistleblowing', 'whistleblowing'], ['pregnancy', 'pregnancy or maternity'], ['health', 'a health condition or disability']] as const) {
      const r = run({ protected: p });
      expect(r.score).toBe(40);
      expect(titles(r)).toContain(`Linked to ${label}`);
      expect(r.flags[0].severity).toBe('error');
    }
  });
  it('no investigation +20, with redundancy wording', () => {
    expect(run({ investigation: 'no' }).score).toBe(20);
    expect(titles(run({ investigation: 'no' }))).toContain('No documented investigation');
    expect(titles(run({ investigation: 'no' }, 'redundancy'))).toContain('Selection process not documented');
  });
  it('no invite +15 mentions the 25% uplift', () => {
    const r = run({ invite: 'no' });
    expect(r.score).toBe(15);
    expect(r.flags[0].fix).toMatch(/25%/);
  });
  it('evidence +10 warning', () => {
    const r = run({ evidence: 'no' });
    expect(r.score).toBe(10);
    expect(r.flags[0].severity).toBe('warning');
  });
  it('warnings only count for conduct and capability', () => {
    expect(run({ warnings: 'no' }, 'conduct').score).toBe(15);
    expect(run({ warnings: 'no' }, 'capability').score).toBe(15);
    expect(run({ warnings: 'no' }, 'redundancy').score).toBe(0);
    expect(run({ warnings: 'no' }, 'grievance').score).toBe(0);
  });
  it('no appeal +12', () => expect(run({ appeal: 'no' }).score).toBe(12));
  it('inconsistent +12, unsure +5', () => {
    expect(run({ consistent: 'no' }).score).toBe(12);
    expect(titles(run({ consistent: 'unsure' }))).toEqual(['Consistency not checked']);
    expect(run({ consistent: 'unsure' }).score).toBe(5);
  });
  it('under qualifying period takes off 20, floored at 0', () => {
    const r = run({ invite: 'no', appeal: 'no' }, 'conduct', 12, 24);
    expect(r.score).toBe(7);
    expect(titles(r)).toContain('Under your 24-month qualifying period');
    expect(run({ evidence: 'no' }, 'conduct', 3, 6).score).toBe(0);
  });
  it('qualifying discount skipped for grievance, protected reasons, or enough service', () => {
    expect(titles(run({}, 'grievance', 2, 24))).toEqual(['Process looks sound']);
    expect(run({ protected: 'whistleblowing' }, 'conduct', 2, 24).score).toBe(40);
    expect(titles(run({}, 'conduct', 24, 24))).toEqual(['Process looks sound']);
    expect(titles(run({}, 'conduct', 0, 0))).toEqual(['Process looks sound']);
  });
  it('service of 0 is under any non-zero period', () => expect(titles(run({}, 'conduct', 0, 6))).toContain('Under your 6-month qualifying period'));
  it('levels', () => {
    expect(levelFor(49)).toBe('medium');
    expect(levelFor(50)).toBe('high');
    expect(levelFor(25)).toBe('medium');
    expect(levelFor(24)).toBe('low');
  });
  it('whistleblowing with short service is high', () => {
    const r = run({ protected: 'whistleblowing', evidence: 'no' }, 'conduct', 3, 24);
    expect(r.score).toBe(50);
    expect(r.level).toBe('high');
  });
  it('seeded cases', () => {
    const levels = seedCases().map((c) => assess(c, 24).level);
    expect(levels).toEqual(['low', 'high', 'low', 'medium']);
    expect(assess(seedCases()[3], 24).score).toBe(40);
  });
  it('qualifying period changes the result', () => {
    const t3 = seedCases()[2];
    expect(assess(t3, 24).score).toBe(0);
    expect(assess(t3, 6).score).toBe(20);
  });
});

describe('case drafts', () => {
  it('next reference', () => {
    expect(nextRef(seedCases())).toBe('HR-0422');
    expect(nextRef([])).toBe('HR-0422');
    expect(nextRef([{ ...seedCases()[0], ref: 'HR-0500' }])).toBe('HR-0501');
  });
  it('validates initials then service', () => {
    const d = blankDraft();
    expect(validateDraft(d)?.field).toBe('initials');
    expect(validateDraft({ ...d, initials: 'AB' })?.field).toBe('service');
    expect(validateDraft({ ...d, initials: 'AB', service: '-1' })?.field).toBe('service');
    expect(validateDraft({ ...d, initials: 'AB', service: '1.5' })?.field).toBe('service');
    expect(validateDraft({ ...d, initials: 'AB', service: '700' })?.field).toBe('service');
    expect(validateDraft({ ...d, initials: 'AB', service: '0' })).toBeNull();
  });
  it('round trips a case', () => {
    const d = draftFromCase(seedCases()[0]);
    expect(d.service).toBe('30');
    expect(serviceOf(d)).toBe(30);
    expect(serviceOf(blankDraft())).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import { horizonEvents, weekTicks } from '@/lib/logic/horizon';
import { seedWorkspace } from '@/lib/seed';
import { isoInDays } from '@/lib/format';

const base = new Date(2026, 9, 14);

describe('horizon events', () => {
  const ev = horizonEvents(seedWorkspace(base), base);
  const byId = Object.fromEntries(ev.map((e) => [e.id, e]));
  it('uses notice-by for auto-renewing contracts within range', () => {
    expect(byId['h-c1']).toMatchObject({ day: 8, title: 'Notice deadline: Enterprise CRM licence' });
    expect(byId['h-c2']).toMatchObject({ day: 30 });
  });
  it('falls back to renewal date when notice has passed or not auto-renewing', () => {
    expect(byId['h-c3']).toMatchObject({ day: 12, title: 'Renews: Cloud hosting' });
    expect(byId['h-c8']).toMatchObject({ day: 88, title: 'Renews: Cyber insurance' });
  });
  it('skips contracts outside 90 days or without dates', () => {
    for (const id of ['h-c5', 'h-c7', 'h-c11']) expect(byId[id]).toBeUndefined();
    expect(byId['h-c9']).toMatchObject({ day: 50 });
    expect(byId['h-c12']).toMatchObject({ day: 70, title: 'Notice deadline: Customer MSA' });
  });
  it('includes non-minimal AI reviews only', () => {
    expect(byId['h-a1']).toBeUndefined();
    expect(byId['h-a4']).toMatchObject({ day: 0 });
    expect(byId['h-a2']).toMatchObject({ day: 14 });
  });
  it('includes HR stages, follow ups and the board', () => {
    expect(byId['h-t4']).toMatchObject({ day: 4, title: 'Appeal: HR-0421' });
    expect(byId['h-p4']).toMatchObject({ day: 40 });
    expect(byId['h-board']).toMatchObject({ day: 17 });
    expect(byId['h-pack']).toMatchObject({ day: 12, title: 'Board pack due' });
  });
  it('is sorted and within 0 to 90', () => {
    expect(ev.every((e, i) => i === 0 || ev[i - 1].day <= e.day)).toBe(true);
    expect(ev.every((e) => e.day >= 0 && e.day <= 90)).toBe(true);
  });
  it('drops board events out of range', () => {
    const d = seedWorkspace(base);
    d.board.meetingInDays = 3;
    const e = horizonEvents(d, base);
    expect(e.some((x) => x.id === 'h-pack')).toBe(false);
    expect(e.some((x) => x.id === 'h-board')).toBe(true);
  });
  it('uses party when value is unknown', () => {
    const d = seedWorkspace(base);
    d.contracts = [{ ...d.contracts[4], autoRenews: false, value: null, renews: isoInDays(10, base) }];
    expect(horizonEvents(d, base).find((e) => e.id === 'h-c5')!.detail).toBe('Arrow Leasing');
  });
});

describe('gridlines', () => {
  it('weekly ticks', () => expect(weekTicks()).toEqual([7, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84]));
});

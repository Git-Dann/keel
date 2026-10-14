import { describe, expect, it } from 'vitest';
import { daysUntil, fmtDate, fmtShort, isoInDays, money, plural, rel } from '@/lib/format';

const base = new Date(2026, 9, 14);
describe('format', () => {
  it('dates in British English', () => {
    expect(fmtDate('2026-10-14')).toBe('14 Oct 2026');
    expect(fmtDate(null)).toBe('Not found');
    expect(fmtShort('2026-10-14')).toBe('14 Oct');
  });
  it('relative days', () => {
    expect([rel(0), rel(1), rel(-1), rel(5), rel(-3)]).toEqual(['today', 'tomorrow', 'yesterday', 'in 5 days', '3 days ago']);
    expect(daysUntil(isoInDays(10, base), base)).toBe(10);
  });
  it('money', () => {
    expect(money(48000)).toBe('£48,000');
    expect(money(null)).toBe('Not stated');
    expect(plural(1, 'tool')).toBe('1 tool');
    expect(plural(2, 'tool')).toBe('2 tools');
  });
});

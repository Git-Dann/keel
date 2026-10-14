import { describe, expect, it } from 'vitest';
import {
  contractStatus, countByStatus, extractedContract, filterContracts, isDuplicateName, nameFromFile,
  noticeBy, noticeCell, noticeLetter, validateUpload, MAX_UPLOAD_BYTES,
} from '@/lib/logic/contracts';
import { seedContracts } from '@/lib/seed';
import { isoInDays } from '@/lib/format';
import type { Contract } from '@/lib/types';

const base = new Date(2026, 9, 14);
const mk = (o: Partial<Contract>): Contract => ({
  id: 'x', name: 'X', party: 'P', type: 'Software', value: 1000, renews: isoInDays(200, base), noticeDays: 30,
  autoRenews: true, owner: 'O', obligations: [], lowConfidence: [], reviewed: false, reminderSet: false, ...o,
});

describe('noticeBy', () => {
  it('subtracts the notice period', () => expect(noticeBy(mk({ renews: '2026-12-31', noticeDays: 30 }))).toBe('2026-12-01'));
  it('is null without a renewal date', () => expect(noticeBy(mk({ renews: null }))).toBeNull());
  it('is null without a notice period', () => expect(noticeBy(mk({ noticeDays: null }))).toBeNull());
});

describe('contractStatus', () => {
  it('review when no renewal date', () => expect(contractStatus(mk({ renews: null }), base)).toBe('review'));
  it('review when anything is low confidence', () => expect(contractStatus(mk({ lowConfidence: ['Value'] }), base)).toBe('review'));
  it('expired when renewal date is past', () => expect(contractStatus(mk({ renews: isoInDays(-1, base) }), base)).toBe('expired'));
  it('locked when auto-renewing and notice passed', () => expect(contractStatus(mk({ renews: isoInDays(12, base), noticeDays: 30 }), base)).toBe('locked'));
  it('due when notice falls within 30 days', () => expect(contractStatus(mk({ renews: isoInDays(38, base), noticeDays: 30 }), base)).toBe('due'));
  it('due on the 30th day exactly', () => expect(contractStatus(mk({ renews: isoInDays(60, base), noticeDays: 30 }), base)).toBe('due'));
  it('due when notice is today', () => expect(contractStatus(mk({ renews: isoInDays(30, base), noticeDays: 30 }), base)).toBe('due'));
  it('upcoming when renewing in 90 days and notice is further out', () =>
    expect(contractStatus(mk({ renews: isoInDays(90, base), noticeDays: 10 }), base)).toBe('upcoming'));
  it('upcoming when not auto-renewing and within 90 days', () =>
    expect(contractStatus(mk({ renews: isoInDays(12, base), noticeDays: 30, autoRenews: false }), base)).toBe('upcoming'));
  it('healthy when far out', () => expect(contractStatus(mk({ renews: isoInDays(200, base), noticeDays: 30 }), base)).toBe('healthy'));
  it('auto-renewing with no notice period falls through to date rules', () =>
    expect(contractStatus(mk({ renews: isoInDays(50, base), noticeDays: null }), base)).toBe('upcoming'));

  it('matches the seeded portfolio', () => {
    const s = Object.fromEntries(seedContracts(base).map((c) => [c.id, contractStatus(c, base)]));
    expect(s).toEqual({
      c1: 'due', c2: 'due', c3: 'locked', c4: 'due', c5: 'healthy', c6: 'due',
      c7: 'review', c8: 'upcoming', c9: 'healthy', c10: 'locked', c11: 'review', c12: 'healthy',
    });
  });
});

describe('table helpers', () => {
  const list = seedContracts(base);
  it('counts statuses', () => expect(countByStatus(list, base)).toMatchObject({ due: 4, locked: 2, review: 2 }));
  it('filters by status and query', () => {
    expect(filterContracts(list, 'locked', '', base).map((c) => c.id)).toEqual(['c3', 'c10']);
    expect(filterContracts(list, 'all', 'lease', base).map((c) => c.id).sort()).toEqual(['c2', 'c5']);
    expect(filterContracts(list, 'all', 'northwind', base)).toHaveLength(1);
    expect(filterContracts(list, 'healthy', 'zzz', base)).toHaveLength(0);
  });
  it('notice column text', () => {
    expect(noticeCell(list.find((c) => c.id === 'c7')!)).toEqual({ kind: 'text', text: 'Not found' });
    expect(noticeCell(list.find((c) => c.id === 'c5')!)).toEqual({ kind: 'text', text: 'Does not auto-renew' });
    expect(noticeCell(mk({ noticeDays: null }))).toEqual({ kind: 'text', text: 'Not found' });
    expect(noticeCell(list.find((c) => c.id === 'c1')!).kind).toBe('date');
  });
  it('letter names the party and date', () => {
    const l = noticeLetter(list[0]);
    expect(l).toContain('Dear Northwind Software Ltd');
    expect(l).toContain('Enterprise CRM licence');
  });
});

describe('upload', () => {
  it('rejects wrong type', () => expect(validateUpload({ name: 'a.png', size: 10 })).toMatch(/not a PDF or Word/));
  it('rejects empty', () => expect(validateUpload({ name: 'a.pdf', size: 0 })).toMatch(/empty/));
  it('rejects too large', () => expect(validateUpload({ name: 'a.docx', size: MAX_UPLOAD_BYTES + 1 })).toMatch(/limit is 25 MB/));
  it('accepts pdf, doc, docx', () => {
    for (const n of ['a.pdf', 'a.DOC', 'a.docx']) expect(validateUpload({ name: n, size: 5 })).toBeNull();
  });
  it('names from file', () => {
    expect(nameFromFile('acme_supply-agreement.pdf')).toBe('Acme supply agreement');
    expect(nameFromFile('.pdf')).toBe('Untitled contract');
  });
  it('detects duplicates case-insensitively', () => {
    expect(isDuplicateName(seedContracts(base), ' cloud HOSTING ')).toBe(true);
    expect(isDuplicateName(seedContracts(base), 'New thing')).toBe(false);
  });
  it('extracted contract renews in 118 days with 90 days notice and needs review', () => {
    const c = extractedContract('n1', 'Thing', 'Party', base);
    expect(c.renews).toBe(isoInDays(118, base));
    expect(c.noticeDays).toBe(90);
    expect(c.lowConfidence).toEqual(['Annual value']);
    expect(contractStatus(c, base)).toBe('review');
    expect(contractStatus({ ...c, lowConfidence: [] }, base)).toBe('due');
  });
});

import { describe, expect, it } from 'vitest';
import { answer, FALLBACK, SUGGESTED_QUESTIONS } from '@/lib/logic/askKeel';
import { seedWorkspace } from '@/lib/seed';

const base = new Date(2026, 9, 14);
const d = seedWorkspace(base);

describe('Ask Keel', () => {
  it('answers every suggested question', () => {
    for (const q of SUGGESTED_QUESTIONS) expect(answer(q, d, base).text).not.toBe(FALLBACK);
  });
  it('renewals this month', () => {
    const a = answer('What renews this month?', d, base);
    expect(a.items?.map((i) => i.split(':')[0])).toEqual(['Cloud hosting', 'Product analytics']);
  });
  it('risky AI tools', () => {
    const a = answer('Which AI tools are risky?', d, base);
    expect(a.items).toHaveLength(5);
  });
  it('high-risk HR cases go to HR, not AI', () => {
    const a = answer('Any high-risk HR cases?', d, base);
    expect(a.items).toEqual(['HR-0415: high risk, 5 issues to fix']);
  });
  it('board readiness', () => {
    const a = answer('Is the board pack ready?', d, base);
    expect(a.text).toMatch(/in 17 days/);
    expect(a.items).toEqual(['Linear is stale', 'BambooHR is disconnected']);
  });
  it('prospects', () => expect(answer('Which prospect should I call?', d, base).text).toMatch(/Harlow & Finch/));
  it('falls back', () => expect(answer('What is the weather?', d, base).text).toBe(FALLBACK));
  it('handles empty workspaces', () => {
    const e = { ...d, cases: [], prospects: [], contracts: [], ai: [] };
    expect(answer('hr cases', e, base).text).toMatch(/no open HR cases/);
    expect(answer('contracts', e, base).text).toMatch(/Nothing renews/);
    expect(answer('ai tools', e, base).text).toMatch(/No AI tools/);
    expect(answer('prospects', e, base).text).toMatch(/no target accounts/);
  });
});

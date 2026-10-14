import { describe, expect, it } from 'vitest';
import {
  averagePaperwork, isShadowAi, isUnowned, newTool, paperworkFromDuties, reassess, seedDuties, TIER_DUTIES,
  tierFromUses, usesToPurpose, withSeededDuties,
} from '@/lib/logic/ai';
import { seedAi } from '@/lib/seed';

describe('tierFromUses', () => {
  it('no uses is not assessed', () => expect(tierFromUses([])).toBe('unassessed'));
  it('emotion is prohibited', () => expect(tierFromUses(['emotion'])).toBe('prohibited'));
  it('hiring is high', () => expect(tierFromUses(['hire'])).toBe('high'));
  it('credit is high', () => expect(tierFromUses(['credit'])).toBe('high'));
  it('customer chat is limited', () => expect(tierFromUses(['chat'])).toBe('limited'));
  it('media is limited', () => expect(tierFromUses(['media'])).toBe('limited'));
  it('internal is minimal', () => expect(tierFromUses(['internal'])).toBe('minimal'));
  it('riskiest use wins', () => {
    expect(tierFromUses(['internal', 'chat'])).toBe('limited');
    expect(tierFromUses(['internal', 'hire', 'media'])).toBe('high');
    expect(tierFromUses(['credit', 'emotion'])).toBe('prohibited');
  });
});

describe('duties and paperwork', () => {
  it('duty counts by tier', () => {
    expect(TIER_DUTIES.prohibited).toHaveLength(3);
    expect(TIER_DUTIES.high).toHaveLength(5);
    expect(TIER_DUTIES.limited).toHaveLength(3);
    expect(TIER_DUTIES.minimal).toHaveLength(2);
    expect(TIER_DUTIES.unassessed).toEqual(['Run the assessment']);
  });
  it('seeds round(% x n) duties', () => {
    expect(seedDuties(40, 'high')).toEqual({ 0: true, 1: true, 2: false, 3: false, 4: false });
    expect(seedDuties(80, 'limited')).toEqual({ 0: true, 1: true, 2: false });
    expect(seedDuties(10, 'prohibited')).toEqual({ 0: false, 1: false, 2: false });
    expect(seedDuties(100, 'minimal')).toEqual({ 0: true, 1: true });
  });
  it('derives paperwork from ticks', () => {
    expect(paperworkFromDuties({ 0: true, 1: true, 2: false, 3: false, 4: false }, 'high')).toBe(40);
    expect(paperworkFromDuties({ 0: true }, 'limited')).toBe(33);
    expect(paperworkFromDuties({}, 'minimal')).toBe(0);
    expect(paperworkFromDuties({ 0: true, 9: true }, 'unassessed')).toBe(100);
  });
  it('seeds a tool once', () => {
    const t = withSeededDuties(seedAi()[1]);
    expect(t.dutiesSeeded).toBe(true);
    expect(withSeededDuties(t)).toBe(t);
  });
  it('averages paperwork', () => {
    expect(averagePaperwork(seedAi())).toBe(54);
    expect(averagePaperwork([])).toBe(0);
  });
});

describe('tool helpers', () => {
  it('flags shadow AI and missing owners', () => {
    const a = seedAi();
    expect(isShadowAi(a[9])).toBe(true);
    expect(isShadowAi(a[0])).toBe(false);
    expect(isUnowned(a[3])).toBe(true);
    expect(isUnowned({ ...a[0], owner: '  ' })).toBe(true);
    expect(isUnowned(a[0])).toBe(false);
  });
  it('reassessing to a new tier resets paperwork', () => {
    const t = seedAi()[1];
    const r = reassess(t, 'limited');
    expect(r.tier).toBe('limited');
    expect(r.paperwork).toBe(0);
    expect(reassess(t, 'high')).toBe(t);
  });
  it('new tool defaults', () => {
    const t = newTool('n', { name: ' Bot ', vendor: '', owner: '', uses: ['chat'] });
    expect(t).toMatchObject({ name: 'Bot', vendor: 'Unknown', owner: 'Unassigned', tier: 'limited', paperwork: 0 });
    expect(usesToPurpose(['chat', 'media'])).toContain('; ');
    expect(newTool('m', { name: 'Q', vendor: 'V', owner: 'O', uses: [] }).purpose).toBe('Not described yet');
  });
});

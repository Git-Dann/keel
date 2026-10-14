import { describe, expect, it } from 'vitest';
import { buildAlerts, visibleAlerts } from '@/lib/logic/alerts';
import { seedWorkspace } from '@/lib/seed';

const base = new Date(2026, 9, 14);

describe('alerts', () => {
  const d = seedWorkspace(base);
  const all = buildAlerts(d, base);
  it('builds each kind', () => {
    expect(all.map((a) => a.title)).toEqual([
      'Cloud hosting renews automatically',
      'Product analytics renews automatically',
      'MoodLens looks prohibited',
      'HR-0415 is high risk',
      'Notice due for Enterprise CRM licence',
      'Notice due for Office lease, Manchester',
      'Notice due for Payroll bureau',
      'Notice due for Brand agency retainer',
      'Linear data is 9 days old',
      'BambooHR is disconnected',
    ]);
  });
  it('errors sort before warnings', () => {
    const firstWarn = all.findIndex((a) => a.severity === 'warning');
    expect(all.slice(firstWarn).every((a) => a.severity === 'warning')).toBe(true);
  });
  it('links to the record', () => {
    expect(all[0].href).toBe('/contracts?open=c3');
    expect(all.find((a) => a.module === 'tribunal')!.href).toBe('/tribunal?open=t2');
  });
  it('recalculates after a change', () => {
    const d2 = seedWorkspace(base);
    d2.board.sources = d2.board.sources.map((s) => ({ ...s, status: 'ok' as const, hoursSinceSync: 0 }));
    d2.ai = d2.ai.filter((a) => a.tier !== 'prohibited');
    expect(buildAlerts(d2, base).some((a) => a.module === 'board' || a.module === 'ai')).toBe(false);
  });
  it('hides dismissed alerts', () => {
    expect(visibleAlerts(all, ['al-c3']).some((a) => a.id === 'al-c3')).toBe(false);
    expect(visibleAlerts(all, all.map((a) => a.id))).toEqual([]);
  });
});

'use client';

import { useCallback, useMemo, useState } from 'react';
import { Plus } from '@untitledui/icons';
import { Button } from '@/components/ui/untitled/base/buttons/button';
import { Callout, Card, HelperBanner, Kpi, KpiGrid, PageHeader, Segmented } from '@/components/ui/Primitives';
import { useKeel } from '@/lib/store';
import { useOverlay } from '@/lib/ui-store';
import { useRecordParam } from '@/lib/useRecordParam';
import { averagePaperwork, isUnowned, TIER_FILTERS, TIER_META } from '@/lib/logic/ai';
import type { AiTier } from '@/lib/types';
import { AiTable } from './AiTable';
import { AiDrawer } from './AiDrawer';

export function AiPage() {
  const ai = useKeel((s) => s.data.ai);
  const setOverlay = useOverlay((s) => s.set);
  const [filter, setFilter] = useState<'all' | AiTier>('all');
  const exists = useCallback((id: string) => ai.some((a) => a.id === id), [ai]);
  const { openId, open, close } = useRecordParam(exists, 'AI tool not found');
  const by = (t: AiTier) => ai.filter((a) => a.tier === t).length;
  const rows = useMemo(() => ai.filter((a) => filter === 'all' || a.tier === filter), [ai, filter]);
  const selected = ai.find((a) => a.id === openId) ?? null;

  return (
    <>
      <PageHeader
        title="AI register"
        sub="Every AI tool in the business, what it does, and which EU AI Act rules apply."
        actions={
          <Button color="primary" size="md" iconLeading={Plus} onPress={() => setOverlay({ wizard: { step: 1 } })}>
            Add AI tool
          </Button>
        }
      />
      <HelperBanner id="ai" title="Start with what you know, Keel fills the gaps">
        Add each tool and say how it is used. Keel suggests a risk tier and the paperwork it needs, so treat it as guidance and confirm with your legal adviser.
      </HelperBanner>
      <Callout tone="info" className="mb-6" title="Timelines have moved before.">
        Keel tracks obligations by tier, not fixed dates. Confirm current application dates with counsel before planning around them.
      </Callout>
      <KpiGrid>
        <Kpi label="Tools on register" value={ai.length} sub={`${ai.filter(isUnowned).length} without an owner`} help="Every AI tool Keel knows about, including ones found through expenses." />
        <Kpi label="Banned uses" value={by('prohibited')} sub="Stop using these" help={TIER_META.prohibited.tip} alert={by('prohibited') > 0} />
        <Kpi label="High risk" value={by('high')} sub="Need full documentation" help={TIER_META.high.tip} />
        <Kpi label="Paperwork complete" value={`${averagePaperwork(ai)}%`} sub="Average across all tools" help="The share of required evidence each tool has on file, averaged across the register." />
      </KpiGrid>
      <Card aria-label="AI tools">
        <div className="border-b border-secondary px-4 py-3 sm:px-5">
          <Segmented
            label="Filter by risk tier"
            value={filter}
            onChange={setFilter}
            options={TIER_FILTERS.map((t) => (t === 'all' ? { id: t, label: 'All' } : { id: t, label: TIER_META[t].label, count: by(t) }))}
          />
        </div>
        <AiTable rows={rows} onOpen={open} onShowAll={() => setFilter('all')} />
      </Card>
      <AiDrawer tool={selected} onClose={close} />
    </>
  );
}

'use client';

import { useEffect } from 'react';
import { RefreshCw01 } from '@untitledui/icons';
import { Button } from '@/components/ui/untitled/base/buttons/button';
import { Checkbox } from '@/components/ui/untitled/base/checkbox/checkbox';
import { Callout, ProgressBar } from '@/components/ui/Primitives';
import { Drawer } from '@/components/ui/Overlay';
import { HelpTip } from '@/components/ui/HelpTip';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useKeel } from '@/lib/store';
import { useOverlay } from '@/lib/ui-store';
import { isShadowAi, isUnowned, TIER_DUTIES, TIER_META } from '@/lib/logic/ai';
import { fmtDay, rel } from '@/lib/format';
import type { AiTool } from '@/lib/types';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 py-2.5 sm:grid-cols-[150px_1fr] sm:gap-4">
      <dt className="text-sm text-tertiary">{label}</dt>
      <dd className="min-w-0 text-sm break-words text-primary">{children}</dd>
    </div>
  );
}

export function AiDrawer({ tool: t, onClose }: { tool: AiTool | null; onClose: () => void }) {
  const seed = useKeel((s) => s.seedToolDuties);
  const toggleDuty = useKeel((s) => s.toggleDuty);
  const setOverlay = useOverlay((s) => s.set);

  useEffect(() => {
    if (t && !t.dutiesSeeded) seed(t.id);
  }, [t, seed]);

  if (!t) return <Drawer isOpen={false} onClose={onClose} title="">{null}</Drawer>;
  const tier = TIER_META[t.tier];
  const duties = TIER_DUTIES[t.tier];

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={t.name}
      subtitle={t.vendor}
      footer={
        <>
          <Button
            color="secondary"
            size="md"
            iconLeading={RefreshCw01}
            onPress={() => {
              onClose();
              setOverlay({ wizard: { step: 2, toolId: t.id, fromTier: t.tier } });
            }}
          >
            Reassess
          </Button>
          <Button color="primary" size="md" onPress={onClose}>
            Done
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {t.tier === 'prohibited' && (
          <Callout tone="error" title="Emotion recognition at work is a banned practice.">
            Switch the tool off, record the date you did, and keep the evidence. Narrow medical and safety uses are the only exceptions. Confirm the details with counsel.
          </Callout>
        )}
        {isShadowAi(t) && (
          <Callout tone="warning" title="Shadow AI.">
            Nobody approved this tool and it may be sending company data to a vendor you do not know. Assign an owner and find out what it does.
          </Callout>
        )}
        {!isShadowAi(t) && isUnowned(t) && (
          <Callout tone="warning" title="No owner.">
            Every AI tool needs someone who answers for it. Assign an owner before the next review.
          </Callout>
        )}
      </div>
      <dl className="mt-4 divide-y divide-secondary">
        <Row label="Risk tier">
          <StatusBadge tone={tier.tone} tip={tier.tip}>
            {tier.label}
          </StatusBadge>
        </Row>
        <Row label="Used for">{t.purpose}</Row>
        <Row label="Used by">{t.usedBy}</Row>
        <Row label="Owner">{t.owner}</Row>
        <Row label="Next review">
          {fmtDay(t.reviewInDays)}, {rel(t.reviewInDays)}
        </Row>
      </dl>
      <section className="mt-6" aria-labelledby="duties-h">
        <h3 id="duties-h" className="flex items-center gap-1.5 text-md font-semibold text-primary">
          What this tier needs <HelpTip text="Tick each item once the evidence is on file. The paperwork score updates as you go." label="About duties" />
        </h3>
        <div className="mt-2">
          <ProgressBar value={t.paperwork} label={`Paperwork for ${t.name}`} />
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {duties.map((d, i) => (
            <li key={d} className="rounded-lg border border-secondary px-4 py-3 has-[[data-selected]]:border-utility-brand-200 has-[[data-selected]]:bg-utility-brand-50">
              <Checkbox size="md" label={d} isSelected={!!t.dutiesDone[i]} onChange={(v) => toggleDuty(t.id, i, v)} className="w-full" />
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-quaternary">Guidance only, not legal advice.</p>
      </section>
    </Drawer>
  );
}

import type { AiTier, AiTool, AiUse } from '../types';
import type { Tone } from './contracts';

export const AI_USES: { id: AiUse; label: string; tier: Exclude<AiTier, 'unassessed'> }[] = [
  { id: 'emotion', label: 'Reads emotions of staff or students', tier: 'prohibited' },
  { id: 'hire', label: 'Screens, ranks or scores job candidates', tier: 'high' },
  { id: 'credit', label: 'Decides credit, insurance or access to services for individuals', tier: 'high' },
  { id: 'chat', label: 'Talks directly to customers or the public', tier: 'limited' },
  { id: 'media', label: 'Creates images, audio or video', tier: 'limited' },
  { id: 'internal', label: 'Drafting, coding or summarising for staff', tier: 'minimal' },
];

const ORDER: AiTier[] = ['prohibited', 'high', 'limited', 'minimal'];

/** The riskiest selected use decides the tier. No uses means not assessed. */
export function tierFromUses(uses: AiUse[]): AiTier {
  const tiers = uses.map((u) => AI_USES.find((x) => x.id === u)?.tier).filter(Boolean) as AiTier[];
  return ORDER.find((t) => tiers.includes(t)) ?? 'unassessed';
}

export const TIER_DUTIES: Record<AiTier, string[]> = {
  prohibited: ['Stop using the tool', 'Record the decision and date', 'Tell the vendor and cancel the contract'],
  high: ['Risk management plan', 'Human oversight named', 'Activity logging switched on', 'Vendor conformity documents', 'Staff told and trained'],
  limited: ['Users told they are talking to AI', 'AI-made content labelled', 'Vendor terms checked'],
  minimal: ['Listed on register', 'Yearly review booked'],
  unassessed: ['Run the assessment'],
};

export const TIER_META: Record<AiTier, { label: string; tone: Tone; tip: string }> = {
  prohibited: { label: 'Prohibited', tone: 'error', tip: 'This use is banned under the EU AI Act. Stop using it and document the decision.' },
  high: { label: 'High risk', tone: 'warning', tip: 'Needs risk management, human oversight, logging and documentation before and during use.' },
  limited: { label: 'Limited risk', tone: 'blue', tip: 'Transparency duties apply. People must know they are dealing with AI or AI-made content.' },
  minimal: { label: 'Minimal risk', tone: 'success', tip: 'No specific obligations. Keep it on the register and review it yearly.' },
  unassessed: { label: 'Not assessed', tone: 'gray', tip: 'Keel has no assessment yet. Run the assessment to find the tier.' },
};

export const TIER_FILTERS: ('all' | AiTier)[] = ['all', 'prohibited', 'high', 'limited', 'minimal', 'unassessed'];

/** Tick the first round(% x duties) duties, as on first open of a seeded tool. */
export function seedDuties(paperwork: number, tier: AiTier): Record<number, boolean> {
  const n = TIER_DUTIES[tier].length;
  const k = Math.round((paperwork / 100) * n);
  const out: Record<number, boolean> = {};
  for (let i = 0; i < n; i++) out[i] = i < k;
  return out;
}

export function paperworkFromDuties(done: Record<number, boolean>, tier: AiTier): number {
  const n = TIER_DUTIES[tier].length;
  const ticked = Object.entries(done).filter(([i, v]) => v && Number(i) < n).length;
  return Math.round((ticked / n) * 100);
}

/** Returns the tool with its duties seeded from its paperwork percentage, if not done yet. */
export function withSeededDuties(t: AiTool): AiTool {
  if (t.dutiesSeeded) return t;
  return { ...t, dutiesDone: seedDuties(t.paperwork, t.tier), dutiesSeeded: true };
}

export function averagePaperwork(list: AiTool[]): number {
  if (!list.length) return 0;
  return Math.round(list.reduce((s, t) => s + t.paperwork, 0) / list.length);
}

export const isShadowAi = (t: AiTool) => t.vendor.trim().toLowerCase() === 'unknown';
export const isUnowned = (t: AiTool) => !t.owner.trim() || t.owner === 'Unassigned';

export function usesToPurpose(uses: AiUse[]): string {
  return uses.map((u) => AI_USES.find((x) => x.id === u)?.label ?? '').filter(Boolean).join('; ');
}

/** Applying a reassessment. Changing tier resets paperwork. */
export function reassess(t: AiTool, tier: AiTier): AiTool {
  if (t.tier === tier) return t;
  return { ...t, tier, paperwork: 0, dutiesDone: seedDuties(0, tier), dutiesSeeded: true };
}

export function newTool(id: string, w: { name: string; vendor: string; owner: string; uses: AiUse[] }): AiTool {
  const tier = tierFromUses(w.uses);
  return {
    id,
    name: w.name.trim(),
    vendor: w.vendor.trim() || 'Unknown',
    purpose: usesToPurpose(w.uses) || 'Not described yet',
    usedBy: 'To confirm',
    tier,
    owner: w.owner.trim() || 'Unassigned',
    paperwork: 0,
    dutiesDone: seedDuties(0, tier),
    dutiesSeeded: true,
    reviewInDays: 30,
  };
}

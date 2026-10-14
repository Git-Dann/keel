'use client';

import { CpuChip01 } from '@untitledui/icons';
import { Button } from '@/components/ui/untitled/base/buttons/button';
import { EmptyState, ProgressBar } from '@/components/ui/Primitives';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Truncate } from '@/components/ui/Truncate';
import { isUnowned, TIER_META } from '@/lib/logic/ai';
import type { AiTool } from '@/lib/types';

const th = 'px-5 py-3 text-left text-xs font-medium whitespace-nowrap text-quaternary';
const td = 'px-5 py-4 align-middle text-sm text-tertiary @max-[680px]:flex @max-[680px]:items-center @max-[680px]:gap-2 @max-[680px]:px-0 @max-[680px]:py-1';
const cardLabel = 'w-24 shrink-0 text-xs text-quaternary @[680px]:hidden';

export function AiTable({ rows, onOpen, onShowAll }: { rows: AiTool[]; onOpen: (id: string) => void; onShowAll: () => void }) {
  if (!rows.length)
    return (
      <EmptyState
        icon={CpuChip01}
        title="No tools in this tier"
        action={
          <Button color="secondary" size="md" onPress={onShowAll}>
            Show all tools
          </Button>
        }
      >
        Try another filter, or add a tool to the register.
      </EmptyState>
    );
  return (
    <div className="@container">
      <table className="w-full table-fixed border-collapse @max-[680px]:block">
        <caption className="sr-only">AI tools. Select a row to open its details.</caption>
        <colgroup className="@max-[680px]:hidden">
          <col className="w-[22%]" />
          <col className="w-[24%]" />
          <col className="w-[12%]" />
          <col className="w-[13%]" />
          <col className="w-[15%]" />
          <col className="w-[14%]" />
        </colgroup>
        <thead className="bg-secondary @max-[680px]:hidden">
          <tr className="border-b border-secondary">
            <th scope="col" className={th}>Tool</th>
            <th scope="col" className={th}>Used for</th>
            <th scope="col" className={th}>Used by</th>
            <th scope="col" className={th}>Owner</th>
            <th scope="col" className={th}>Paperwork</th>
            <th scope="col" className={th}>Risk tier</th>
          </tr>
        </thead>
        <tbody className="@max-[680px]:block">
          {rows.map((t) => {
            const tier = TIER_META[t.tier];
            return (
              <tr
                key={t.id}
                tabIndex={0}
                aria-label={`${t.name}, ${tier.label}, paperwork ${t.paperwork}%. Open details`}
                onClick={() => onOpen(t.id)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
                    e.preventDefault();
                    onOpen(t.id);
                  }
                }}
                className="cursor-pointer border-b border-secondary outline-offset-[-2px] transition-colors last:border-b-0 hover:bg-primary_hover @max-[680px]:block @max-[680px]:px-4 @max-[680px]:py-3"
              >
                <th scope="row" className="px-5 py-4 text-left font-normal @max-[680px]:block @max-[680px]:px-0 @max-[680px]:pt-0 @max-[680px]:pb-2">
                  <Truncate text={t.name} className="text-sm font-semibold text-primary" />
                  <Truncate text={t.vendor} className="text-sm text-tertiary" />
                </th>
                <td className={td}>
                  <span className={cardLabel}>Used for</span>
                  <span className="line-clamp-2 min-w-0 text-secondary" title={t.purpose}>
                    {t.purpose}
                  </span>
                </td>
                <td className={td}>
                  <span className={cardLabel}>Used by</span>
                  <Truncate text={t.usedBy} className="text-secondary" />
                </td>
                <td className={td}>
                  <span className={cardLabel}>Owner</span>
                  {isUnowned(t) ? (
                    <StatusBadge tone="warning" dot={false}>
                      Unassigned
                    </StatusBadge>
                  ) : (
                    <Truncate text={t.owner} className="text-secondary" />
                  )}
                </td>
                <td className={td}>
                  <span className={cardLabel}>Paperwork</span>
                  <ProgressBar value={t.paperwork} label={`Paperwork for ${t.name}`} />
                </td>
                <td className={td}>
                  <span className={cardLabel}>Risk tier</span>
                  <StatusBadge tone={tier.tone} tip={tier.tip}>
                    {tier.label}
                  </StatusBadge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

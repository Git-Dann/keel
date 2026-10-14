'use client';

import { SearchLg } from '@untitledui/icons';
import { Button } from '@/components/ui/untitled/base/buttons/button';
import { EmptyState } from '@/components/ui/Primitives';
import { HelpTip } from '@/components/ui/HelpTip';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Truncate } from '@/components/ui/Truncate';
import { CONTRACT_STATUS, contractStatus, noticeCell } from '@/lib/logic/contracts';
import { daysUntil, fmtDate, money, rel } from '@/lib/format';
import type { Contract } from '@/lib/types';

const th = 'px-5 py-3 text-left text-xs font-medium whitespace-nowrap text-quaternary';
const td = 'px-5 py-4 align-middle text-sm text-tertiary @max-[680px]:flex @max-[680px]:items-baseline @max-[680px]:gap-2 @max-[680px]:px-0 @max-[680px]:py-1';
const cardLabel = 'w-28 shrink-0 text-xs text-quaternary @[680px]:hidden';

function DateCell({ iso }: { iso: string }) {
  const d = daysUntil(iso);
  return (
    <span>
      <span className="text-secondary">{fmtDate(iso)}</span>
      <span className="block text-xs text-quaternary @max-[680px]:ml-1.5 @max-[680px]:inline">{rel(d)}</span>
    </span>
  );
}

export function ContractsTable({ rows, onOpen, onClear, query }: { rows: Contract[]; onOpen: (id: string) => void; onClear: () => void; query: string }) {
  if (!rows.length) {
    return (
      <EmptyState
        icon={SearchLg}
        title="No contracts match"
        action={
          <Button color="secondary" size="md" onPress={onClear}>
            Clear filters
          </Button>
        }
      >
        {query.trim() ? `Nothing matches "${query.trim()}" with this filter.` : 'Nothing has this status right now.'}
      </EmptyState>
    );
  }
  return (
    <div className="@container">
      <table className="w-full table-fixed border-collapse @max-[680px]:block">
        <caption className="sr-only">Contracts. Select a row to open its details.</caption>
        <colgroup className="@max-[680px]:hidden">
          <col className="w-[30%]" />
          <col className="w-[12%]" />
          <col className="w-[15%]" />
          <col className="w-[16%]" />
          <col className="w-[12%]" />
          <col className="w-[15%]" />
        </colgroup>
        <thead className="bg-secondary @max-[680px]:hidden">
          <tr className="border-b border-secondary">
            <th scope="col" className={th}>Contract</th>
            <th scope="col" className={th}>Value a year</th>
            <th scope="col" className={th}>
              <span className="inline-flex items-center gap-1">
                Renews <HelpTip text="The end of the current term. Not found means Keel could not read one." label="About renewal dates" />
              </span>
            </th>
            <th scope="col" className={th}>
              <span className="inline-flex items-center gap-1">
                Give notice by <HelpTip text="The renewal date minus the notice period. After this date, an auto-renewing contract rolls over." label="About notice dates" />
              </span>
            </th>
            <th scope="col" className={th}>Owner</th>
            <th scope="col" className={th}>Status</th>
          </tr>
        </thead>
        <tbody className="@max-[680px]:block">
          {rows.map((c) => {
            const st = CONTRACT_STATUS[contractStatus(c)];
            const nc = noticeCell(c);
            return (
              <tr
                key={c.id}
                tabIndex={0}
                aria-label={`${c.name}, ${st.label}. Open details`}
                onClick={() => onOpen(c.id)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
                    e.preventDefault();
                    onOpen(c.id);
                  }
                }}
                className="cursor-pointer border-b border-secondary outline-offset-[-2px] transition-colors last:border-b-0 hover:bg-primary_hover @max-[680px]:block @max-[680px]:px-4 @max-[680px]:py-3"
              >
                <th scope="row" className="px-5 py-4 text-left font-normal @max-[680px]:block @max-[680px]:px-0 @max-[680px]:pt-0 @max-[680px]:pb-2">
                  <Truncate text={c.name} className="text-sm font-semibold text-primary" />
                  <Truncate text={`${c.party} · ${c.type}`} className="text-sm text-tertiary" />
                </th>
                <td className={td}>
                  <span className={cardLabel}>Value a year</span>
                  <span className={c.value == null ? 'text-quaternary' : 'text-secondary'}>{money(c.value)}</span>
                </td>
                <td className={td}>
                  <span className={cardLabel}>Renews</span>
                  {c.renews ? <DateCell iso={c.renews} /> : <span className="text-quaternary">Not found</span>}
                </td>
                <td className={td}>
                  <span className={cardLabel}>Give notice by</span>
                  {nc.kind === 'date' ? <DateCell iso={nc.iso} /> : <span className="text-quaternary">{nc.text}</span>}
                </td>
                <td className={td}>
                  <span className={cardLabel}>Owner</span>
                  <Truncate text={c.owner} className="text-secondary" />
                </td>
                <td className={td}>
                  <span className={cardLabel}>Status</span>
                  <StatusBadge tone={st.tone} tip={st.tip}>
                    {st.label}
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

'use client';

import { useCallback, useMemo, useState } from 'react';
import { File06, SearchLg, Upload01 } from '@untitledui/icons';
import { Button } from '@/components/ui/untitled/base/buttons/button';
import { Card, HelperBanner, Kpi, KpiGrid, PageHeader, Segmented } from '@/components/ui/Primitives';
import { useKeel } from '@/lib/store';
import { useOverlay } from '@/lib/ui-store';
import { useRecordParam } from '@/lib/useRecordParam';
import { countByStatus, filterContracts, type ContractFilter } from '@/lib/logic/contracts';
import { money } from '@/lib/format';
import { ContractsTable } from './ContractsTable';
import { ContractDrawer } from './ContractDrawer';

export function ContractsPage() {
  const contracts = useKeel((s) => s.data.contracts);
  const setOverlay = useOverlay((s) => s.set);
  const [filter, setFilter] = useState<ContractFilter>('all');
  const [query, setQuery] = useState('');
  const exists = useCallback((id: string) => contracts.some((c) => c.id === id), [contracts]);
  const { openId, open, close } = useRecordParam(exists, 'Contract not found');

  const counts = useMemo(() => countByStatus(contracts), [contracts]);
  const rows = useMemo(() => filterContracts(contracts, filter, query), [contracts, filter, query]);
  const live = contracts.length - counts.expired;
  const total = contracts.reduce((s, c) => s + (c.value ?? 0), 0);
  const selected = contracts.find((c) => c.id === openId) ?? null;

  return (
    <>
      <PageHeader
        title="Contracts"
        sub="Every renewal date, notice period and penalty, pulled out of the paperwork and watched for you."
        actions={
          <>
            <Button color="secondary" size="md" iconLeading={File06} onPress={() => setOverlay({ uploadOpen: true, uploadSample: true })}>
              Try a sample
            </Button>
            <Button color="primary" size="md" iconLeading={Upload01} onPress={() => setOverlay({ uploadOpen: true, uploadSample: false })}>
              Upload contract
            </Button>
          </>
        }
      />
      <HelperBanner id="contracts" title="Upload once, never miss a notice date">
        Keel reads each contract, finds the renewal date and notice period, and warns you before the window closes. Anything it cannot read with confidence is marked for review, never guessed.
      </HelperBanner>
      <KpiGrid>
        <Kpi label="Live contracts" value={live} sub={`${money(total)} a year in total`} help="Contracts that have not expired. The total counts every contract where Keel found an annual value." />
        <Kpi label="Notices due" value={counts.due} sub="Notice window closes within 30 days" help="Contracts that renew automatically unless you give notice soon." alert={counts.due > 0} />
        <Kpi label="Notice missed" value={counts.locked} sub="Will renew automatically" help="The notice deadline has passed. You can still negotiate, but with less leverage." alert={counts.locked > 0} />
        <Kpi label="Needs review" value={counts.review} sub="Terms Keel could not read" help="Keel never guesses a date. If a key term is unclear, it asks a person to check." />
      </KpiGrid>

      <Card aria-label="Contract list">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary px-4 py-3 sm:px-5">
          <Segmented
            label="Filter by status"
            value={filter}
            onChange={setFilter}
            options={[
              { id: 'all', label: 'All' },
              { id: 'due', label: 'Notice due', count: counts.due },
              { id: 'locked', label: 'Missed', count: counts.locked },
              { id: 'review', label: 'Review', count: counts.review },
              { id: 'healthy', label: 'Healthy', count: counts.healthy },
            ]}
          />
          <div className="relative w-full sm:w-72">
            <SearchLg className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-fg-quaternary" aria-hidden />
            <label htmlFor="contract-search" className="sr-only">
              Search contracts
            </label>
            <input
              id="contract-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contracts"
              className="h-10 w-full rounded-lg bg-primary pr-3 pl-10 text-md text-primary shadow-xs ring-1 ring-primary ring-inset placeholder:text-placeholder focus:ring-2 focus:ring-brand focus:outline-hidden"
            />
          </div>
        </div>
        <ContractsTable
          rows={rows}
          query={query}
          onOpen={open}
          onClear={() => {
            setFilter('all');
            setQuery('');
          }}
        />
      </Card>
      <ContractDrawer contract={selected} onClose={close} />
    </>
  );
}

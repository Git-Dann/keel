'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchLg, Stars02 } from '@untitledui/icons';
import { cx } from '@/utils/cx';
import { Button } from '@/components/ui/untitled/base/buttons/button';
import { Card, CardHeader, HelperBanner, PageHeader } from '@/components/ui/Primitives';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { newId, useKeel } from '@/lib/store';
import { useRecordParam } from '@/lib/useRecordParam';
import { useMediaQuery } from '@/lib/hooks';
import { BRIEFING_STEPS, FIT_TIP, FIT_TONE, fitBand, newThinProspect, searchProspects } from '@/lib/logic/accounts';
import type { Prospect } from '@/lib/types';
import { BriefingEmpty, BriefingLoading, BriefingView, SuggestPanel } from './Briefing';

type Panel =
  | { kind: 'empty'; for: null }
  | { kind: 'suggest'; for: null; query: string; matches: Prospect[] }
  | { kind: 'loading'; for: string; step: number; run: number; pending?: Prospect }
  | { kind: 'brief'; for: string };

const STEP_MS = 625; // four steps, about 2.5 seconds in total

const briefedLabel = (n: number | null) => (n == null ? 'Not briefed yet' : n === 0 ? 'Briefed today' : n === 1 ? 'Briefed yesterday' : `Briefed ${n} days ago`);

export function AccountsPage() {
  const router = useRouter();
  const prospects = useKeel((s) => s.data.prospects);
  const markBriefed = useKeel((s) => s.markBriefed);
  const stacked = useMediaQuery('(max-width: 1079.98px)');
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const exists = useCallback((id: string) => prospects.some((p) => p.id === id), [prospects]);
  const { openId, open } = useRecordParam(exists, 'Account not found');

  const [panel, setPanel] = useState<Panel>(() => (openId ? { kind: 'loading', for: openId, step: 0, run: 0 } : { kind: 'empty', for: null }));
  // A new ?open= starts a fresh briefing ("reset state on prop change" pattern).
  if (openId && panel.for !== openId) setPanel({ kind: 'loading', for: openId, step: 0, run: (panel.kind === 'loading' ? panel.run : 0) + 1 });

  const sorted = useMemo(() => [...prospects].sort((a, b) => b.fit - a.fit), [prospects]);

  // Staged progress while a briefing builds.
  const loadingKey = panel.kind === 'loading' ? `${panel.for}:${panel.run}` : null;
  useEffect(() => {
    if (panel.kind !== 'loading') return;
    const { for: id, pending } = panel;
    const timers = BRIEFING_STEPS.map((_, i) =>
      setTimeout(() => {
        if (i < BRIEFING_STEPS.length - 1) {
          setPanel((p) => (p.kind === 'loading' && p.for === id ? { ...p, step: i + 1 } : p));
          return;
        }
        const target = pending ?? useKeel.getState().data.prospects.find((p) => p.id === id);
        if (!target) return;
        markBriefed(target);
        setPanel({ kind: 'brief', for: id });
        if (pending) router.replace(`/accounts?open=${id}`, { scroll: false });
      }, STEP_MS * (i + 1)),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingKey]);

  const scrollToPanel = () => {
    if (stacked) setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const pick = (id: string) => {
    if (id === openId) setPanel({ kind: 'loading', for: id, step: 0, run: Date.now() });
    else open(id);
    scrollToPanel();
  };

  const submit = () => {
    const r = searchProspects(query, prospects);
    if (r.kind === 'empty') {
      setSearchError('Type a company name or website first, or pick one from your list.');
      inputRef.current?.focus();
      return;
    }
    if (r.kind === 'short') {
      setSearchError('Use at least two characters so Keel can find the right company.');
      inputRef.current?.focus();
      return;
    }
    setSearchError('');
    if (r.kind === 'exact') pick(r.prospect.id);
    else {
      setPanel({ kind: 'suggest', for: null, query: r.query, matches: r.matches });
      if (openId) router.replace('/accounts', { scroll: false });
      scrollToPanel();
    }
  };

  const shown = panel.kind === 'brief' ? prospects.find((p) => p.id === panel.for) : undefined;
  const loadingName = panel.kind === 'loading' ? (panel.pending?.name ?? prospects.find((p) => p.id === panel.for)?.name ?? 'Briefing') : '';

  return (
    <>
      <PageHeader title="Account research" sub="A one-page briefing on any prospect, built from filings, news and hiring, so nobody walks into a meeting cold." />
      <HelperBanner id="accounts" title="Brief a meeting in under a minute">
        Search a company or pick one from your list. Keel pulls filings, leadership moves and hiring patterns into a briefing with suggested openers.
      </HelperBanner>

      <Card className="mb-6">
        <form
          className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          noValidate
          role="search"
        >
          <div className="min-w-0 flex-1">
            <label htmlFor="account-search" className="sr-only">
              Company name or website
            </label>
            <div className="relative">
              <SearchLg className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-fg-quaternary" aria-hidden />
              <input
                ref={inputRef}
                id="account-search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (searchError) setSearchError('');
                }}
                placeholder="Company name or website"
                autoComplete="off"
                aria-invalid={!!searchError}
                aria-describedby="account-search-msg"
                className={cx(
                  'h-10 w-full rounded-lg bg-primary pr-3 pl-10 text-md text-primary shadow-xs ring-1 ring-primary ring-inset placeholder:text-placeholder focus:ring-2 focus:ring-brand focus:outline-hidden',
                  searchError && 'ring-error_subtle focus:ring-error',
                )}
              />
            </div>
            <p id="account-search-msg" className={cx('mt-1.5 text-sm', searchError ? 'text-error-primary' : 'text-tertiary')} role={searchError ? 'alert' : undefined}>
              {searchError || 'Try "Harlow & Finch", or something new like "Quayside Foods" to see a thin-data briefing.'}
            </p>
          </div>
          <Button type="submit" color="primary" size="md" iconLeading={Stars02}>
            Build briefing
          </Button>
        </form>
      </Card>

      <div className="grid items-start gap-6 split:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card aria-labelledby="targets-h">
          <CardHeader id="targets-h" title="Target accounts" sub="Sorted by fit" />
          <ul className="divide-y divide-secondary">
            {sorted.map((p) => {
              const active = panel.for === p.id;
              return (
                <li key={p.id} className="relative">
                  <button
                    type="button"
                    onClick={() => pick(p.id)}
                    aria-current={active ? 'true' : undefined}
                    className={cx(
                      'flex w-full items-center gap-3 py-4 pr-24 pl-5 text-left transition-colors hover:bg-primary_hover',
                      active && 'bg-utility-brand-50 shadow-[inset_3px_0_0_var(--color-fg-brand-primary)] hover:bg-utility-brand-50 dark:bg-tertiary dark:hover:bg-tertiary',
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-primary" title={p.name}>
                        {p.name}
                      </span>
                      <span className="block truncate text-sm text-tertiary">
                        {p.sector} · {briefedLabel(p.briefedDaysAgo)}
                      </span>
                    </span>
                  </button>
                  <span className="absolute top-1/2 right-5 -translate-y-1/2">
                    <StatusBadge tone={FIT_TONE[fitBand(p.fit)]} tip={FIT_TIP} dot={false}>
                      Fit {p.fit}
                    </StatusBadge>
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        <div ref={panelRef} className="scroll-mt-4">
          <Card aria-label="Briefing" className="min-h-[320px]">
            {panel.kind === 'empty' && <BriefingEmpty />}
            {panel.kind === 'suggest' && (
              <SuggestPanel
                query={panel.query}
                matches={panel.matches}
                onPick={pick}
                onBuild={() => {
                  const p = newThinProspect(newId('p'), panel.query);
                  setPanel({ kind: 'loading', for: p.id, step: 0, run: Date.now(), pending: p });
                }}
              />
            )}
            {panel.kind === 'loading' && <BriefingLoading name={loadingName} step={panel.step} />}
            {panel.kind === 'brief' && (shown ? <BriefingView p={shown} onRefresh={() => setPanel({ kind: 'loading', for: shown.id, step: 0, run: Date.now() })} /> : <BriefingEmpty />)}
          </Card>
        </div>
      </div>
    </>
  );
}

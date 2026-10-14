'use client';

import { Copy01, RefreshCw01, Target04 } from '@untitledui/icons';
import { Button } from '@/components/ui/untitled/base/buttons/button';
import { Callout, EmptyState, Skeleton, Spinner } from '@/components/ui/Primitives';
import { HelpTip } from '@/components/ui/HelpTip';
import { Tooltip } from '@/components/ui/Tooltip';
import { BRIEFING_STEPS, briefingText, oneLiner, openers } from '@/lib/logic/accounts';
import { copyText } from '@/lib/actions';
import type { Prospect } from '@/lib/types';

export function BriefingEmpty() {
  return (
    <EmptyState icon={Target04} title="Pick an account">
      Choose a company on the left or search above to build a briefing.
    </EmptyState>
  );
}

export function BriefingLoading({ name, step }: { name: string; step: number }) {
  return (
    <div aria-busy="true">
      <div className="flex items-center justify-between gap-3 border-b border-secondary px-5 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-primary">{name}</h2>
          <p className="mt-0.5 text-sm text-tertiary" aria-live="polite">
            {BRIEFING_STEPS[Math.min(step, BRIEFING_STEPS.length - 1)]}…
          </p>
        </div>
        <Spinner className="size-5 text-fg-brand-primary" />
      </div>
      <ol className="flex flex-wrap gap-x-4 gap-y-1 px-5 pt-4 text-xs text-quaternary" aria-label="Progress">
        {BRIEFING_STEPS.map((s, i) => (
          <li key={s} className={i < step ? 'text-secondary' : i === step ? 'font-semibold text-brand-secondary' : ''}>
            {i + 1}. {s}
            <span className="sr-only">{i < step ? ', done' : i === step ? ', in progress' : ''}</span>
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-3 p-5">
        {[92, 76, 84, 60, 88, 70].map((w, i) => (
          <div key={i} style={{ width: `${w}%` }}>
            <Skeleton className="h-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SuggestPanel({ query, matches, onPick, onBuild }: { query: string; matches: Prospect[]; onPick: (id: string) => void; onBuild: () => void }) {
  return (
    <div>
      <div className="border-b border-secondary px-5 py-4">
        <h2 className="text-lg font-semibold break-words text-primary">No exact match for &ldquo;{query}&rdquo;</h2>
        <p className="mt-0.5 text-sm text-tertiary">{matches.length ? 'Did you mean one of these?' : 'Nothing similar in your list.'}</p>
      </div>
      <ul className="divide-y divide-secondary">
        {matches.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => onPick(p.id)} className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-primary_hover">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-primary">{p.name}</span>
                <span className="block text-sm text-tertiary">
                  {p.sector} · {p.domain}
                </span>
              </span>
            </button>
          </li>
        ))}
        <li className="flex flex-wrap items-center gap-3 px-5 py-4">
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold break-words text-primary">Build a new briefing for &ldquo;{query}&rdquo;</span>
            <span className="block text-sm text-tertiary">Keel searches public sources only</span>
          </span>
          <Button color="secondary" size="md" onPress={onBuild}>
            Build anyway
          </Button>
        </li>
      </ul>
    </div>
  );
}

export function BriefingView({ p, onRefresh }: { p: Prospect; onRefresh: () => void }) {
  return (
    <article aria-labelledby="brief-h">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary px-5 py-4">
        <div className="min-w-0">
          <h2 id="brief-h" className="text-lg font-semibold break-words text-primary">
            {p.name}
          </h2>
          <p className="mt-0.5 text-sm break-words text-tertiary">
            {p.sector} · {p.size} · {p.domain}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button color="secondary" size="md" iconLeading={RefreshCw01} onPress={onRefresh}>
            Refresh
          </Button>
          <Button color="primary" size="md" iconLeading={Copy01} onPress={() => copyText(briefingText(p), 'Briefing copied')}>
            Copy briefing
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-6 px-5 py-5">
        {p.thinData && (
          <Callout tone="warning" title="Thin data.">
            Keel found very little public information. Treat this as a starting point and check the company website before the call.
          </Callout>
        )}
        <section>
          <h3 className="text-md font-semibold text-primary">In one line</h3>
          <p className="mt-1.5 max-w-[72ch] text-sm text-secondary">{oneLiner(p)}</p>
        </section>
        <section>
          <h3 className="flex items-center gap-1.5 text-md font-semibold text-primary">
            Financials <HelpTip text="From the latest accounts filed at Companies House. Private companies under two years old may have none." label="About financials" />
          </h3>
          <p className="mt-1.5 max-w-[72ch] text-sm text-secondary">
            {p.filings ?? (p.thinData ? 'No filings found. The company may be new, or trade under a different registered name.' : `No accounts filed yet. ${p.risk}`)}
          </p>
        </section>
        <section>
          <h3 className="text-md font-semibold text-primary">Signals</h3>
          {p.signals.length ? (
            <ul className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {p.signals.map((s) => (
                <li key={s.kind + s.text} className="rounded-lg border border-secondary px-4 py-3">
                  <p className="text-xs font-medium text-tertiary">{s.kind}</p>
                  <p className="mt-1 text-sm font-semibold text-primary">{s.text}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-sm text-tertiary">No hiring, funding or leadership signals found in the last 90 days.</p>
          )}
        </section>
        <section>
          <h3 className="text-md font-semibold text-primary">Suggested openers</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {openers(p).map((o) => (
              <li key={o} className="flex items-start gap-3 rounded-lg border border-secondary px-4 py-3">
                <p className="min-w-0 flex-1 text-sm text-secondary">{o}</p>
                <Tooltip content="Copy this opener">
                  <Button color="tertiary" size="sm" iconLeading={Copy01} aria-label="Copy opener" onPress={() => copyText(o, 'Opener copied')} className="-my-1 size-9 justify-center" />
                </Tooltip>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="text-md font-semibold text-primary">Watch out for</h3>
          <p className="mt-1.5 max-w-[72ch] text-sm text-secondary">{p.risk}</p>
        </section>
        <p className="text-xs text-quaternary">Demo data. Every company here is fictional. In the full product each claim links to its filing, article or job post.</p>
      </div>
    </article>
  );
}

'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Scales02 } from '@untitledui/icons';
import { cx } from '@/utils/cx';
import { Button } from '@/components/ui/untitled/base/buttons/button';
import { Card, CardHeader, EmptyState, HelperBanner, PageHeader } from '@/components/ui/Primitives';
import { SelectField } from '@/components/ui/Fields';
import { HelpTip } from '@/components/ui/HelpTip';
import { ConfirmDialog } from '@/components/ui/Overlay';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useKeel } from '@/lib/store';
import { toast } from '@/lib/ui-store';
import { useRecordParam } from '@/lib/useRecordParam';
import { useMediaQuery } from '@/lib/hooks';
import { assess, blankDraft, draftFromCase, LEVEL_META, QUALIFYING_OPTIONS, type CaseDraft } from '@/lib/logic/tribunal';
import { rel, sentenceCase } from '@/lib/format';
import type { Settings } from '@/lib/types';
import { Checker } from './Checker';

export function TribunalPage() {
  const router = useRouter();
  const params = useSearchParams();
  const cases = useKeel((s) => s.data.cases);
  const q = useKeel((s) => s.data.settings.qualifyingMonths);
  const setQualifying = useKeel((s) => s.setQualifying);
  const saveCase = useKeel((s) => s.saveCase);
  const closeCase = useKeel((s) => s.closeCase);
  const stacked = useMediaQuery('(max-width: 1079.98px)');
  const checkerRef = useRef<HTMLDivElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const exists = useCallback((id: string) => cases.some((c) => c.id === id), [cases]);
  const { openId } = useRecordParam(exists, 'Case not found');
  const isNew = params.get('new') === '1';
  const sel = openId ?? (isNew || !cases.length ? 'new' : cases[0].id);

  const make = (id: string): CaseDraft => {
    const c = cases.find((x) => x.id === id);
    return c ? draftFromCase(c) : blankDraft();
  };
  const [state, setState] = useState<{ for: string; draft: CaseDraft }>(() => ({ for: sel, draft: make(sel) }));
  // Adjust the draft when the selection changes (React's "reset state on prop change" pattern).
  if (state.for !== sel) setState({ for: sel, draft: make(sel) });
  const draft = state.draft;

  const scores = useMemo(() => Object.fromEntries(cases.map((c) => [c.id, assess(c, q)])), [cases, q]);

  const select = (id: string) => {
    router.push(`/tribunal?open=${id}`, { scroll: false });
    if (stacked) setTimeout(() => checkerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  return (
    <>
      <PageHeader
        title="Tribunal risk"
        sub="Check a dismissal or grievance against the process a tribunal expects, before the decision is made."
        actions={
          <>
            <div className="flex items-center gap-1.5">
              <SelectField
                label="Qualifying period"
                hideLabel
                value={String(q)}
                options={QUALIFYING_OPTIONS.map((o) => ({ value: String(o.months), label: o.label }))}
                onChange={(e) => {
                  setQualifying(Number(e.target.value) as Settings['qualifyingMonths']);
                  toast('Rule updated', 'Every case has been rescored against the new qualifying period.');
                }}
                className="w-60"
              />
              <HelpTip text="The qualifying period for ordinary unfair dismissal is changing in law. Set the rule that applies to your cases." label="About the qualifying period" />
            </div>
            <Button color="primary" size="md" iconLeading={Plus} onPress={() => router.push('/tribunal?new=1', { scroll: false })}>
              New check
            </Button>
          </>
        }
      />
      <HelperBanner id="tribunal" title="Catch the procedural slips that lose cases">
        Most tribunal losses come from process, not the reason itself. Answer the questions and Keel shows what to fix. It is a checklist, not legal advice, and it never stores names.
      </HelperBanner>

      <div className="grid items-start gap-6 min-[1080px]:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]">
        <Card aria-labelledby="cases-h">
          <CardHeader id="cases-h" title="Open cases" sub="Initials only, by design" />
          {cases.length ? (
            <ul className="divide-y divide-secondary">
              {cases.map((c) => {
                const r = scores[c.id];
                const active = sel === c.id;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => select(c.id)}
                      aria-current={active ? 'true' : undefined}
                      className={cx(
                        'flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-primary_hover',
                        active && 'bg-utility-brand-50 shadow-[inset_3px_0_0_var(--color-fg-brand-primary)] hover:bg-utility-brand-50 dark:bg-tertiary dark:hover:bg-tertiary',
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-primary">
                          {c.ref} · {c.initials}
                        </span>
                        <span className="block text-sm text-tertiary">
                          {sentenceCase(c.kind)} · {c.stage} {rel(c.stageInDays)}
                        </span>
                      </span>
                      <StatusBadge tone={LEVEL_META[r.level].tone}>{LEVEL_META[r.level].label}</StatusBadge>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={Scales02}
              title="No open cases"
              action={
                <Button color="secondary" size="md" iconLeading={Plus} onPress={() => router.push('/tribunal?new=1', { scroll: false })}>
                  New check
                </Button>
              }
            >
              Start a check before any formal meeting.
            </EmptyState>
          )}
        </Card>

        <div ref={checkerRef} className="scroll-mt-4">
          <Checker
            key={state.for}
            draft={draft}
            onChange={(d) => setState((s) => ({ ...s, draft: d }))}
            qualifyingMonths={q}
            onSave={(d) => {
              const saved = saveCase(d);
              const level = LEVEL_META[assess(saved, q).level].label.toLowerCase();
              toast(d.id ? 'Case saved' : 'Case added', `${saved.ref} is ${level}.`, assess(saved, q).level === 'high' ? 'warning' : 'success');
              if (!d.id) router.replace(`/tribunal?open=${saved.id}`, { scroll: false });
              else setState({ for: saved.id, draft: draftFromCase(saved) });
            }}
            onClose={() => setConfirmOpen(true)}
          />
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`Close ${draft.ref || 'this case'}?`}
        confirmLabel="Close case"
        destructive
        onConfirm={() => {
          if (draft.id) closeCase(draft.id);
          setConfirmOpen(false);
          toast('Case closed', `${draft.ref} has left the open list.`);
          router.replace('/tribunal', { scroll: false });
        }}
      >
        It leaves the open list and its alert goes away. Keel only ever held initials, so there is nothing else to delete.
      </ConfirmDialog>
    </>
  );
}

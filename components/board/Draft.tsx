'use client';

import { useState } from 'react';
import { addDays } from 'date-fns';
import { Download01, Send01 } from '@untitledui/icons';
import { Button } from '@/components/ui/untitled/base/buttons/button';
import { Card, CardHeader, Skeleton } from '@/components/ui/Primitives';
import { ModalDialog } from '@/components/ui/Overlay';
import { Callout } from '@/components/ui/Primitives';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAllAlerts, useKeel } from '@/lib/store';
import { toast } from '@/lib/ui-store';
import { draftText, sectionHealth, sectionsAtRisk } from '@/lib/logic/board';
import { fmtMonthYear, today } from '@/lib/format';

export function DraftSkeleton() {
  return (
    <Card aria-busy="true" aria-label="Building the draft">
      <div className="flex flex-col gap-3 p-6 sm:p-10">
        <span className="sr-only" aria-live="polite">
          Building the draft pack
        </span>
        <Skeleton className="h-7 w-2/5" />
        <Skeleton className="h-3 w-1/3" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mt-4 flex flex-col gap-2.5">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-11/12" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function Draft() {
  const board = useKeel((s) => s.data.board);
  const editDraft = useKeel((s) => s.editDraft);
  const sendPack = useKeel((s) => s.sendPack);
  const log = useKeel((s) => s.log);
  const alerts = useAllAlerts();
  const [confirm, setConfirm] = useState(false);
  if (!board.draft) return null;

  const included = board.sections.filter((s) => s.included);
  const gaps = sectionsAtRisk(board);
  const month = fmtMonthYear(addDays(today(), board.meetingInDays));

  const send = (withNote: boolean) => {
    sendPack(withNote);
    setConfirm(false);
    toast(
      'Sent to board',
      withNote ? 'The note tells directors which numbers are provisional. In the full product this emails the five directors.' : 'In the full product this emails the pack to the five directors.',
    );
  };

  return (
    <Card aria-labelledby="draft-h">
      <CardHeader
        id="draft-h"
        title="Draft pack"
        sub="Click any paragraph to edit it"
        right={
          <div className="flex flex-wrap gap-2">
            <Button
              color="secondary"
              size="md"
              iconLeading={Download01}
              onPress={() => {
                log('Board pack', 'Exported the draft');
                toast('Export ready', 'In the full product this downloads a branded PDF of the pack.');
              }}
            >
              Export PDF
            </Button>
            <Button color="primary" size="md" iconLeading={Send01} onPress={() => (gaps.length ? setConfirm(true) : send(false))}>
              Send to board
            </Button>
          </div>
        }
      />
      <div className="p-3 sm:p-6">
        <div className="mx-auto max-w-[760px] rounded-xl border border-secondary bg-primary p-5 shadow-md sm:p-10 dark:bg-secondary">
          <h2 className="font-head text-[32px] leading-tight text-primary sm:text-[40px]">Board pack · {month}</h2>
          <p className="mt-2 text-sm text-tertiary">Prepared by Keel for Acme Group. Draft, not for circulation.</p>
          {board.sentAt && <p className="mt-1 text-sm font-medium text-success-primary">Sent to the board. Edits from here go into the next version.</p>}
          {included.length === 0 && <p className="mt-8 text-sm text-tertiary">No sections are ticked. Tick at least one section above to fill the pack.</p>}
          {included.map((s) => {
            const health = sectionHealth(s, board.sources);
            const text = board.draft!.edits[s.id] ?? draftText(s.id, board, alerts);
            return (
              <section key={s.id} className="mt-8">
                <h3 className="flex flex-wrap items-center gap-2 text-md font-semibold text-primary">
                  {s.name}
                  {health !== 'ok' && <StatusBadge tone="warning">{health === 'missing' ? 'Missing data' : 'Stale data'}</StatusBadge>}
                </h3>
                <p
                  contentEditable
                  suppressContentEditableWarning
                  role="textbox"
                  aria-multiline="true"
                  aria-label={`${s.name} paragraph`}
                  tabIndex={0}
                  onBlur={(e) => {
                    const t = e.currentTarget.textContent ?? '';
                    if (t !== text) editDraft(s.id, t);
                  }}
                  className="mt-2 max-w-[68ch] rounded text-md leading-7 text-secondary"
                >
                  {text}
                </p>
              </section>
            );
          })}
        </div>
      </div>
      <ModalDialog
        isOpen={confirm}
        onClose={() => setConfirm(false)}
        title="Send with gaps?"
        role="alertdialog"
        footer={
          <>
            <Button color="secondary" size="md" onPress={() => setConfirm(false)}>
              Go back and fix
            </Button>
            <Button color="primary" size="md" iconLeading={Send01} onPress={() => send(true)}>
              Send with a note
            </Button>
          </>
        }
      >
        <Callout tone="warning" title={`${gaps.length} ${gaps.length === 1 ? 'section uses' : 'sections use'} stale or missing data:`}>
          {gaps.map((g) => g.name).join(', ')}.
        </Callout>
        <p className="mt-4 text-sm text-secondary">Fix the sources first, or send now with a note telling the board which numbers are provisional.</p>
      </ModalDialog>
    </Card>
  );
}

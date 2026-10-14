'use client';

import { useState } from 'react';
import { Bell01, Check, Edit05 } from '@untitledui/icons';
import { Button } from '@/components/ui/untitled/base/buttons/button';
import { Callout } from '@/components/ui/Primitives';
import { Drawer } from '@/components/ui/Overlay';
import { HelpTip } from '@/components/ui/HelpTip';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useKeel } from '@/lib/store';
import { toast } from '@/lib/ui-store';
import { CONTRACT_STATUS, contractStatus, noticeBy } from '@/lib/logic/contracts';
import { daysUntil, fmtDate, money, rel } from '@/lib/format';
import type { Contract } from '@/lib/types';
import { NoticeLetterModal } from './NoticeLetterModal';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 py-2.5 sm:grid-cols-[150px_1fr] sm:gap-4">
      <dt className="text-sm text-tertiary">{label}</dt>
      <dd className="min-w-0 text-sm break-words text-primary">{children}</dd>
    </div>
  );
}

export function ContractDrawer({ contract: c, onClose }: { contract: Contract | null; onClose: () => void }) {
  const markChecked = useKeel((s) => s.markChecked);
  const setReminder = useKeel((s) => s.setReminder);
  const [letterOpen, setLetterOpen] = useState(false);

  if (!c) return <Drawer isOpen={false} onClose={onClose} title="">{null}</Drawer>;

  const status = contractStatus(c);
  const st = CONTRACT_STATUS[status];
  const nb = noticeBy(c);
  const nbDays = nb ? daysUntil(nb) : null;

  return (
    <>
      <Drawer
        isOpen
        onClose={onClose}
        title={c.name}
        subtitle={`${c.party} · ${c.type}`}
        footer={
          <>
            {c.lowConfidence.length > 0 && (
              <Button
                color="secondary"
                size="md"
                iconLeading={Check}
                onPress={() => {
                  const r = markChecked(c.id);
                  if (r === 'no-date') toast('Add the renewal date first', 'Keel still has no renewal date for this contract. Check the source document, then mark it as checked.', 'warning');
                  else if (r === 'ok') toast('Marked as checked', `${c.name} now follows its renewal and notice dates.`);
                }}
              >
                Mark as checked
              </Button>
            )}
            <Button
              color="secondary"
              size="md"
              iconLeading={c.reminderSet ? Check : Bell01}
              isDisabled={c.reminderSet}
              onPress={() => {
                setReminder(c.id);
                toast('Reminder set', nb ? `Keel will remind you 14 days before ${fmtDate(nb)}.` : c.renews ? `Keel will remind you 14 days before ${fmtDate(c.renews)}.` : 'Keel will remind you once the dates are confirmed.');
              }}
            >
              {c.reminderSet ? 'Reminder set' : 'Remind me'}
            </Button>
            {c.autoRenews && c.renews && (
              <Button color="primary" size="md" iconLeading={Edit05} onPress={() => setLetterOpen(true)}>
                Draft notice letter
              </Button>
            )}
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {status === 'locked' && nbDays != null && (
            <Callout tone="error" title={`The notice window closed ${rel(nbDays)}.`}>
              This renews automatically on {fmtDate(c.renews)}. Ask the supplier for an early exit or better terms now, while they still want the renewal to go smoothly.
            </Callout>
          )}
          {status === 'due' && nb && nbDays != null && (
            <Callout tone="warning" title={`Give notice by ${fmtDate(nb)} (${rel(nbDays)})`}>
              if you want to leave or renegotiate.
            </Callout>
          )}
          {c.lowConfidence.length > 0 && (
            <Callout tone="info" title="Check before relying on this.">
              Keel could not read these terms with confidence: {c.lowConfidence.join(', ')}.{c.draft ? ' This looks like an unsigned draft.' : ''}
            </Callout>
          )}
        </div>

        <dl className="mt-4 divide-y divide-secondary">
          <Row label="Status">
            <StatusBadge tone={st.tone} tip={st.tip}>
              {st.label}
            </StatusBadge>
          </Row>
          <Row label="Annual value">{money(c.value)}</Row>
          <Row label="Renews">{c.renews ? `${fmtDate(c.renews)}, ${rel(daysUntil(c.renews))}` : 'Not found'}</Row>
          <Row label="Notice period">{c.noticeDays == null ? 'Not found' : c.noticeDays === 0 ? 'None' : `${c.noticeDays} days`}</Row>
          <Row label="Give notice by">{!c.autoRenews ? 'Does not auto-renew' : nb && nbDays != null ? `${fmtDate(nb)}, ${rel(nbDays)}` : 'Not found'}</Row>
          <Row label="Auto-renews">{c.autoRenews ? 'Yes' : 'No'}</Row>
          <Row label="Owner">{c.owner}</Row>
        </dl>

        <section className="mt-6" aria-labelledby="obligations-h">
          <h3 id="obligations-h" className="text-md font-semibold text-primary">
            Obligations found
          </h3>
          {c.type === 'Customer' && <p className="mt-1 text-sm text-tertiary">Acme is the supplier here, so these are obligations Acme owes the customer. Keel tracks both directions.</p>}
          {c.obligations.length ? (
            <ul className="mt-3 flex flex-col gap-2">
              {c.obligations.map((o) => (
                <li key={o.kind} className="rounded-lg border border-secondary px-4 py-3">
                  <p className="text-sm font-semibold text-primary">{o.kind}</p>
                  <p className="text-sm text-tertiary">{o.text}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-tertiary">No obligations were extracted from this document.</p>
          )}
        </section>

        {c.clause && (
          <section className="mt-6" aria-labelledby="clause-h">
            <h3 id="clause-h" className="flex items-center gap-1.5 text-md font-semibold text-primary">
              Source clause <HelpTip text="The exact wording Keel used, so you can check its reading." label="About the source clause" />
            </h3>
            <blockquote className="mt-2 rounded-r-lg border-l-3 border-utility-brand-300 bg-secondary px-4 py-3 text-sm text-secondary">{c.clause}</blockquote>
          </section>
        )}
        <p className="mt-6 text-xs text-quaternary">Guidance only, not legal advice. Check the signed contract before acting.</p>
      </Drawer>
      <NoticeLetterModal contract={c} isOpen={letterOpen} onClose={() => setLetterOpen(false)} />
    </>
  );
}

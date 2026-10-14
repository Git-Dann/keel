'use client';

import { useState } from 'react';
import { Check, Link01, Shield01 } from '@untitledui/icons';
import { Button } from '@/components/ui/untitled/base/buttons/button';
import { Card, CardHeader } from '@/components/ui/Primitives';
import { ModalDialog } from '@/components/ui/Overlay';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useKeel } from '@/lib/store';
import { toast } from '@/lib/ui-store';
import { syncLabel } from '@/lib/logic/board';
import type { BoardSource } from '@/lib/types';

const REQUESTED: Record<string, { yes: [string, string][]; no: string }> = {
  bamboohr: {
    yes: [
      ['Headcount, starters and leavers', 'Monthly totals only'],
      ['Open roles', 'Job titles and hiring stages'],
    ],
    no: 'Salaries, addresses, absence notes or any personal record',
  },
  linear: { yes: [['Milestones and releases', 'Titles, dates and status']], no: 'Issue comments or attachments' },
  xero: { yes: [['Profit and loss, cash and balance sheet', 'Monthly totals']], no: 'Individual transactions or bank details' },
  hubspot: { yes: [['Pipeline by stage', 'Deal values and close dates']], no: 'Contact details or email content' },
};

export function Sources() {
  const sources = useKeel((s) => s.data.board.sources);
  const syncSource = useKeel((s) => s.syncSource);
  const connectSource = useKeel((s) => s.connectSource);
  const [syncing, setSyncing] = useState<string[]>([]);
  const [connecting, setConnecting] = useState<BoardSource | null>(null);

  const sync = (s: BoardSource) => {
    setSyncing((x) => [...x, s.id]);
    setTimeout(() => {
      syncSource(s.id);
      setSyncing((x) => x.filter((id) => id !== s.id));
      toast(`${s.vendor} synced`, 'Its numbers in the next draft are up to date.');
    }, 900);
  };

  const req = connecting ? (REQUESTED[connecting.id] ?? { yes: [[`${connecting.area} summary`, 'Monthly totals only']], no: 'Personal records' }) : null;

  return (
    <Card aria-labelledby="sources-h">
      <CardHeader id="sources-h" title="Data sources" sub="Where each number comes from" />
      <ul className="divide-y divide-secondary">
        {sources.map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-5 py-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-secondary bg-secondary text-sm font-semibold text-secondary" aria-hidden>
              {s.vendor[0]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-primary">{s.vendor}</span>
              <span className="block truncate text-sm text-tertiary">
                {s.area} · {syncLabel(s)}
              </span>
            </span>
            {s.status === 'ok' ? (
              <StatusBadge tone="success">Fresh</StatusBadge>
            ) : s.status === 'stale' ? (
              <Button color="secondary" size="sm" className="min-h-9" isLoading={syncing.includes(s.id)} showTextWhileLoading onPress={() => sync(s)}>
                {syncing.includes(s.id) ? 'Syncing' : 'Sync now'}
              </Button>
            ) : (
              <Button color="secondary" size="sm" className="min-h-9" iconLeading={Link01} onPress={() => setConnecting(s)}>
                Connect
              </Button>
            )}
          </li>
        ))}
      </ul>
      <ModalDialog
        isOpen={!!connecting}
        onClose={() => setConnecting(null)}
        title={connecting ? `Connect ${connecting.vendor}` : ''}
        subtitle={connecting ? `Read-only access to ${connecting.area.toLowerCase()} data` : undefined}
        footer={
          <>
            <Button color="secondary" size="md" onPress={() => setConnecting(null)}>
              Cancel
            </Button>
            <Button
              color="primary"
              size="md"
              iconLeading={Link01}
              onPress={() => {
                if (!connecting) return;
                connectSource(connecting.id);
                toast(`${connecting.vendor} connected`, `${connecting.area} data will appear in the next draft.`);
                setConnecting(null);
              }}
            >
              Connect {connecting?.vendor}
            </Button>
          </>
        }
      >
        {connecting && req && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-secondary">
              Keel asks {connecting.vendor} for read-only access. It never changes anything in {connecting.vendor}. In the full product you approve this on {connecting.vendor}&rsquo;s own sign-in page.
            </p>
            <div>
              <h3 className="text-sm font-semibold text-primary">What Keel reads</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {req.yes.map(([t, d]) => (
                  <li key={t} className="flex gap-3 rounded-lg bg-utility-green-50 px-4 py-3 ring-1 ring-utility-green-200 ring-inset">
                    <Check className="mt-0.5 size-5 shrink-0 text-utility-green-600" aria-hidden />
                    <span>
                      <span className="block text-sm font-semibold text-primary">{t}</span>
                      <span className="block text-sm text-secondary">{d}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary">What Keel never asks for</h3>
              <p className="mt-2 flex gap-3 rounded-lg border border-secondary px-4 py-3 text-sm text-secondary">
                <Shield01 className="mt-0.5 size-5 shrink-0 text-fg-quaternary" aria-hidden />
                {req.no}
              </p>
            </div>
          </div>
        )}
      </ModalDialog>
    </Card>
  );
}

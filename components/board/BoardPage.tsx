'use client';

import { RefreshCw01, Stars02 } from '@untitledui/icons';
import { cx } from '@/utils/cx';
import { Button } from '@/components/ui/untitled/base/buttons/button';
import { Checkbox } from '@/components/ui/untitled/base/checkbox/checkbox';
import { Callout, Card, CardHeader, HelperBanner, PageHeader, Sparkline } from '@/components/ui/Primitives';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useKeel } from '@/lib/store';
import { toast, useOverlay } from '@/lib/ui-store';
import { startBuildDraft } from '@/lib/actions';
import { BOARD_METRICS } from '@/lib/seed';
import { problemSources, sectionHealth, sectionSourceLabel, sourceProblemText } from '@/lib/logic/board';
import { rel } from '@/lib/format';
import { Sources } from './Sources';
import { Draft, DraftSkeleton } from './Draft';

export function BoardPage() {
  const board = useKeel((s) => s.data.board);
  const syncAll = useKeel((s) => s.syncAll);
  const toggleSection = useKeel((s) => s.toggleSection);
  const building = useOverlay((s) => s.boardBuilding);
  const probs = problemSources(board);

  return (
    <>
      <PageHeader
        title="Board pack"
        sub="Pulls numbers from your finance, sales, delivery and people tools into a draft pack, so the week before the board goes on judgement, not copy and paste."
        actions={
          <>
            <Button
              color="secondary"
              size="md"
              iconLeading={RefreshCw01}
              onPress={() => {
                const stale = board.sources.filter((s) => s.status === 'stale').length;
                const off = board.sources.filter((s) => s.status === 'off');
                syncAll();
                if (off.length) toast(stale ? 'Synced connected sources' : 'Nothing new to sync', `${off.map((s) => s.vendor).join(' and ')} ${off.length === 1 ? 'is' : 'are'} still disconnected. Connect it to include that data.`, 'warning');
                else toast('Synced', 'Every source is fresh.');
              }}
            >
              Sync all
            </Button>
            <Button color="primary" size="md" iconLeading={Stars02} isDisabled={building} onPress={startBuildDraft}>
              {board.draft ? 'Rebuild draft' : 'Build draft pack'}
            </Button>
          </>
        }
      />
      <HelperBanner id="board" title="Connected once, refreshed every month">
        Each section comes from a connected tool. If a source is stale or disconnected, Keel tells you before the pack goes out, not after a director spots it.
      </HelperBanner>

      {probs.length ? (
        <Callout tone="warning" className="mb-6" title={`${probs.length} ${probs.length === 1 ? 'source needs' : 'sources need'} attention before the meeting ${rel(board.meetingInDays)}.`}>
          {probs.map(sourceProblemText).join('. ')}.
        </Callout>
      ) : (
        <Callout tone="success" className="mb-6" title="Every source is fresh.">
          The board meets {rel(board.meetingInDays)}. The pack is due five days before.
        </Callout>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 split:grid-cols-4">
        {BOARD_METRICS.map((m) => (
          <Card key={m.id} as="div" className="p-4 sm:p-5">
            <p className="text-sm font-medium text-tertiary">{m.label}</p>
            <p className="mt-3 font-head text-[30px] leading-none text-primary sm:text-[40px]">{m.value}</p>
            <p className={cx('mt-2 text-sm font-medium', m.good ? 'text-success-primary' : 'text-error-primary')}>
              {m.delta} <span className="font-normal text-tertiary">on last month</span>
              <span className="sr-only">{m.good ? ', a good sign' : ', a bad sign'}</span>
            </p>
            <Sparkline points={m.points} good={m.good} label={`${m.label} over the last 12 months, trending ${m.good ? 'well' : 'badly'}`} />
          </Card>
        ))}
      </div>

      <div className="mb-6 grid items-start gap-6 split:grid-cols-2">
        <Sources />
        <Card aria-labelledby="sections-h">
          <CardHeader id="sections-h" title="Sections" sub="Untick anything this month's pack does not need" />
          <ul className="divide-y divide-secondary">
            {board.sections.map((s) => {
              const health = sectionHealth(s, board.sources);
              return (
                <li key={s.id} className="flex items-center gap-3 px-5 py-4">
                  <Checkbox
                    size="md"
                    isSelected={s.included}
                    onChange={(v) => toggleSection(s.id, v)}
                    label={s.name}
                    hint={sectionSourceLabel(s, board.sources)}
                    className="min-w-0 flex-1"
                  />
                  {health !== 'ok' && (
                    <StatusBadge
                      tone="warning"
                      tip={health === 'missing' ? 'The source is disconnected. Connect it, or untick this section.' : 'The source is out of date. Sync it to refresh these numbers.'}
                    >
                      {health === 'missing' ? 'No data' : 'Stale'}
                    </StatusBadge>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div id="draft">{building ? <DraftSkeleton /> : <Draft />}</div>
    </>
  );
}

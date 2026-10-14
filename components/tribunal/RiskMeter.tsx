import { cx } from '@/utils/cx';
import { LEVEL_META, type RiskLevel } from '@/lib/logic/tribunal';

const FILL: Record<RiskLevel, string> = { low: 'bg-fg-success-secondary', medium: 'bg-fg-warning-secondary', high: 'bg-fg-error-secondary' };
const COUNT: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3 };

/** Three-segment meter with a text label, so colour is never the only signal. */
export function RiskMeter({ level, score }: { level: RiskLevel; score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-secondary">Tribunal risk</span>
        <span className="font-semibold text-primary">
          {LEVEL_META[level].label} <span className="font-normal text-tertiary">· score {score}</span>
        </span>
      </div>
      <div className="mt-2 flex gap-1" role="img" aria-label={`${LEVEL_META[level].label}, score ${score} out of 100`}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={cx('h-2 flex-1 rounded-full', i < COUNT[level] ? FILL[level] : 'bg-quaternary')} />
        ))}
      </div>
    </div>
  );
}

'use client';

import type { FC, ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, InfoCircle, Lightbulb02, XClose } from '@untitledui/icons';
import { cx } from '@/utils/cx';
import { Button } from '@/components/ui/untitled/base/buttons/button';
import { useKeel } from '@/lib/store';
import { HelpTip } from './HelpTip';

export function PageHeader({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-[68ch]">
        <h1 className="font-head text-[36px] leading-[1.05] text-primary sm:text-[44px]">{title}</h1>
        {sub && <p className="mt-2 text-md text-tertiary">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function Card({ children, className, as: As = 'section', ...rest }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article' } & Record<string, unknown>) {
  return (
    <As className={cx('min-w-0 rounded-xl border border-secondary bg-primary shadow-xs', className)} {...rest}>
      {children}
    </As>
  );
}

export function CardHeader({ title, sub, help, right, id }: { title: ReactNode; sub?: ReactNode; help?: string; right?: ReactNode; id?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary px-5 py-4">
      <div className="min-w-0">
        <h2 id={id} className="flex items-center gap-1.5 text-lg font-semibold text-primary">
          {title}
          {help && <HelpTip text={help} />}
        </h2>
        {sub && <p className="mt-0.5 text-sm text-tertiary">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

const CALLOUT: Record<'info' | 'warning' | 'error' | 'success', { box: string; icon: FC<{ className?: string }>; ic: string }> = {
  info: { box: 'bg-utility-blue-50 ring-utility-blue-200', icon: InfoCircle, ic: 'text-utility-blue-600' },
  warning: { box: 'bg-utility-yellow-50 ring-utility-yellow-200', icon: AlertTriangle, ic: 'text-utility-yellow-600' },
  error: { box: 'bg-utility-red-50 ring-utility-red-200', icon: AlertCircle, ic: 'text-utility-red-600' },
  success: { box: 'bg-utility-green-50 ring-utility-green-200', icon: CheckCircle, ic: 'text-utility-green-600' },
};

export function Callout({ tone, title, children, className, role }: { tone: keyof typeof CALLOUT; title?: ReactNode; children?: ReactNode; className?: string; role?: string }) {
  const s = CALLOUT[tone];
  const Icon = s.icon;
  return (
    <div role={role} className={cx('flex gap-3 rounded-lg px-4 py-3 text-sm text-secondary ring-1 ring-inset', s.box, className)}>
      <Icon className={cx('mt-px size-5 shrink-0', s.ic)} aria-hidden />
      <div className="min-w-0">
        {title && <strong className="font-semibold text-primary">{title} </strong>}
        {children}
      </div>
    </div>
  );
}

/** One per page. Dismissible and persisted; "Show tips again" restores it. */
export function HelperBanner({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const hidden = useKeel((s) => s.ui.hiddenTips.includes(id));
  const hideTip = useKeel((s) => s.hideTip);
  if (hidden) return null;
  return (
    <aside aria-label="Tip" className="mb-6 flex items-start gap-3 rounded-xl border border-brand bg-brand-primary_alt p-4 dark:border-secondary dark:bg-secondary">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-secondary text-fg-brand-primary dark:bg-tertiary" aria-hidden>
        <Lightbulb02 className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-primary">{title}</p>
        <p className="mt-0.5 text-sm text-tertiary">{children}</p>
      </div>
      <Button color="tertiary" size="sm" iconLeading={XClose} aria-label="Dismiss tip" onPress={() => hideTip(id)} className="-mt-1 -mr-1 size-10 justify-center" />
    </aside>
  );
}

export function Kpi({ label, value, sub, help, alert }: { label: string; value: ReactNode; sub: ReactNode; help?: string; alert?: boolean }) {
  return (
    <Card as="div" className="p-4 sm:p-5">
      <div className="flex items-center gap-1.5 text-sm font-medium text-tertiary">
        <span className="truncate">{label}</span>
        {help && <HelpTip text={help} />}
      </div>
      <div className={cx('mt-3 font-head text-[34px] leading-none sm:text-[44px]', alert ? 'text-brand-secondary' : 'text-primary')}>{value}</div>
      <div className="mt-2 text-sm text-tertiary">{sub}</div>
    </Card>
  );
}

export function KpiGrid({ children }: { children: ReactNode }) {
  return <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 min-[1080px]:grid-cols-4">{children}</div>;
}

export function EmptyState({ icon: Icon, title, children, action }: { icon: FC<{ className?: string }>; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="px-5 py-12 text-center">
      <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-tertiary text-fg-quaternary" aria-hidden>
        <Icon className="size-6" />
      </span>
      <p className="text-md font-semibold text-primary">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-[44ch] text-sm text-tertiary">{children}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[110px] items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-quaternary" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={label}>
        <div className="h-full rounded-full bg-fg-brand-secondary transition-[width] duration-300" style={{ width: `${value}%` }} />
      </div>
      <span className="w-9 text-right text-sm text-tertiary tabular-nums">{value}%</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('skeleton h-3', className)} aria-hidden />;
}

export function Spinner({ className }: { className?: string }) {
  return <span aria-hidden className={cx('inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent', className)} />;
}

/** Segmented filter (Untitled UI button group style). */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string; count?: number }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex max-w-full flex-wrap gap-1 rounded-lg border border-secondary bg-secondary p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={cx(
            'min-h-9 rounded-md px-3 text-sm font-semibold whitespace-nowrap text-tertiary transition-colors hover:text-secondary',
            value === o.id && 'bg-primary text-primary shadow-xs ring-1 ring-secondary',
          )}
        >
          {o.label}
          {o.count ? <span className="ml-1 text-quaternary">({o.count})</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Sparkline({ points, good, label }: { points: number[]; good: boolean; label: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const w = 120;
  const h = 36;
  const d = points.map((p, i) => `${((i / (points.length - 1)) * w).toFixed(1)},${(h - 4 - ((p - min) / (max - min || 1)) * (h - 8)).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-3 h-9 w-full" role="img" aria-label={label}>
      <polyline points={d} fill="none" className={good ? 'stroke-fg-success-secondary' : 'stroke-fg-error-secondary'} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function SrOnly({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

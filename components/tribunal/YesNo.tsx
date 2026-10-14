'use client';

import { useId } from 'react';
import { cx } from '@/utils/cx';
import { HelpTip } from '@/components/ui/HelpTip';
import type { YesNo } from '@/lib/types';

/** Segmented radio group. Native radios, so arrow keys move between options. */
export function YesNoField({ label, help, value, onChange, notRelevant }: { label: string; help: string; value: YesNo; onChange: (v: YesNo) => void; notRelevant?: boolean }) {
  const name = useId();
  const opts: [YesNo, string][] = [
    ['yes', 'Yes'],
    ['no', 'No'],
    notRelevant ? ['na', 'Not relevant'] : ['unsure', 'Not sure'],
  ];
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-medium text-secondary">
        {label}
        <HelpTip text={help} label="Why this matters" className="ml-1 -mt-0.5" />
      </legend>
      <div className="inline-flex flex-wrap gap-2">
        {opts.map(([v, l]) => (
          <label
            key={v}
            className={cx(
              'flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3.5 text-sm font-semibold text-secondary shadow-xs ring-1 ring-primary ring-inset transition-colors hover:bg-primary_hover has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus-ring',
              value === v && 'bg-utility-brand-50 text-utility-brand-700 ring-utility-brand-300 hover:bg-utility-brand-50',
            )}
          >
            <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} className="size-4 accent-[var(--color-brand-600)] focus-visible:outline-hidden" />
            {l}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

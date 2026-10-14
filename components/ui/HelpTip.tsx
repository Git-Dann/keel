'use client';

import { HelpCircle } from '@untitledui/icons';
import { Tooltip } from './Tooltip';
import { cx } from '@/utils/cx';

/** A small "?" next to a non-obvious label. Hover or focus shows the tip, tap toggles it on touch. */
export function HelpTip({ text, label = 'More information', className }: { text: string; label?: string; className?: string }) {
  return (
    <Tooltip content={text} tapToggle className={cx('align-middle', className)}>
      <button
        type="button"
        aria-label={label}
        className="relative inline-grid size-5 cursor-help place-items-center rounded-full text-fg-quaternary transition-colors hover:text-fg-quaternary_hover before:absolute before:-inset-2.5 before:content-['']"
        onClick={(e) => e.stopPropagation()}
      >
        <HelpCircle className="size-4" aria-hidden />
      </button>
    </Tooltip>
  );
}

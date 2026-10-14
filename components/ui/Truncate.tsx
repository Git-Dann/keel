'use client';

import { useRef, useState } from 'react';
import { cx } from '@/utils/cx';
import { Tooltip } from './Tooltip';

/** Truncates with an ellipsis and shows the full text in a tooltip only when it is cut off. */
export function Truncate({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [cut, setCut] = useState(false);
  const check = () => {
    const el = ref.current;
    if (el) setCut(el.scrollWidth > el.clientWidth + 1);
  };
  return (
    <Tooltip content={text} disabled={!cut} className="block min-w-0">
      <span ref={ref} onPointerEnter={check} onFocus={check} className={cx('block min-w-0 truncate', className)}>
        {text}
      </span>
    </Tooltip>
  );
}

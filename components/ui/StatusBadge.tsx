'use client';

import type { ReactNode } from 'react';
import { BadgeWithDot, Badge } from '@/components/ui/untitled/base/badges/badges';
import type { Tone } from '@/lib/logic/contracts';
import { Tooltip } from './Tooltip';

const COLOR: Record<Tone, 'success' | 'blue' | 'warning' | 'error' | 'gray' | 'brand'> = {
  success: 'success',
  blue: 'blue',
  warning: 'warning',
  error: 'error',
  gray: 'gray',
  brand: 'brand',
};

/** Untitled UI pill badge with a dot. Always carries text, optionally a tooltip. */
export function StatusBadge({ tone, children, tip, dot = true, size = 'sm' }: { tone: Tone; children: ReactNode; tip?: string; dot?: boolean; size?: 'sm' | 'md' }) {
  const badge = dot ? (
    <BadgeWithDot type="pill-color" color={COLOR[tone]} size={size}>
      {children}
    </BadgeWithDot>
  ) : (
    <Badge type="pill-color" color={COLOR[tone]} size={size}>
      {children}
    </Badge>
  );
  if (!tip) return badge;
  return (
    <Tooltip content={tip}>
      <span tabIndex={0} className="inline-flex rounded-full" onClick={(e) => e.stopPropagation()}>
        {badge}
      </span>
    </Tooltip>
  );
}

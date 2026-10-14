import { cx } from '@/utils/cx';

/** Sailing boat mark (hull, mast and sail) in white on an orange rounded square. Same drawing as the favicon. */
export function BoatMark({ className, tile = true }: { className?: string; tile?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden focusable="false">
      {tile && <rect width="32" height="32" rx="8" className="fill-bg-brand-solid" />}
      <path d="M6 20h20l-3.5 5.5h-13z" fill="#fff" />
      <path d="M16 5.5V20" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M17.5 7.5 24 17h-6.5z" fill="#fff" />
      <path d="M14.5 10 9.5 17h5z" fill="#fff" opacity=".7" />
    </svg>
  );
}

export function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <BoatMark className="size-8 shrink-0" />
      <span className={cx('font-head text-[30px] leading-none tracking-[0.04em] text-primary', collapsed && 'sr-only')}>Keel</span>
    </span>
  );
}

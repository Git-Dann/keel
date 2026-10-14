'use client';

import { cloneElement, isValidElement, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '@/utils/cx';

export interface TooltipProps {
  content: ReactNode;
  title?: ReactNode;
  /** Keyboard hint shown after the text, for example "[". */
  kbd?: string;
  placement?: 'bottom' | 'top' | 'right';
  /** Tap toggles the tooltip on touch devices (help icons). */
  tapToggle?: boolean;
  disabled?: boolean;
  /** Extra classes for the wrapper span. */
  className?: string;
  children: ReactElement<Record<string, unknown>>;
}

const GAP = 8;
const EDGE = 8;

/* Tooltips open on focus only when the user is moving focus with the keyboard. */
let keyboardModality = false;
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' || e.key.startsWith('Arrow') || e.key === 'Shift') keyboardModality = true;
  }, true);
  window.addEventListener('pointerdown', () => (keyboardModality = false), true);
}

/**
 * Untitled UI tooltip behaviour, built to WCAG 1.4.13:
 * shows on hover (never touch hover) and keyboard focus, dismisses with Escape,
 * stays open while the pointer is over it, and flips above when there is no room below.
 */
export function Tooltip({ content, title, kbd, placement = 'bottom', tapToggle, disabled, className, children }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const anchor = useRef<HTMLSpanElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
  };
  const show = useCallback(() => {
    if (disabled) return;
    cancelHide();
    setOpen((was) => {
      if (!was) setPos(null);
      return true;
    });
  }, [disabled]);
  const hide = useCallback((now = false) => {
    cancelHide();
    if (now) setOpen(false);
    else hideTimer.current = setTimeout(() => setOpen(false), 120);
  }, []);

  useLayoutEffect(() => {
    if (!open || !anchor.current || !tip.current) return;
    const target = (anchor.current.firstElementChild as HTMLElement | null) ?? anchor.current;
    const r = target.getBoundingClientRect();
    const t = tip.current.getBoundingClientRect();
    let x: number;
    let y: number;
    if (placement === 'right') {
      x = r.right + GAP;
      y = r.top + r.height / 2 - t.height / 2;
    } else {
      x = r.left + r.width / 2 - t.width / 2;
      const below = r.bottom + GAP;
      const above = r.top - t.height - GAP;
      const roomBelow = below + t.height <= window.innerHeight - EDGE;
      y = placement === 'top' ? (above >= EDGE ? above : below) : roomBelow ? below : above;
    }
    x = Math.max(EDGE, Math.min(x, window.innerWidth - t.width - EDGE));
    y = Math.max(EDGE, y);
    setPos({ x, y });
  }, [open, placement, content]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        hide(true);
      }
    };
    const onScroll = () => hide(true);
    const onDown = (e: PointerEvent) => {
      if (!anchor.current?.contains(e.target as Node) && !tip.current?.contains(e.target as Node)) hide(true);
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('pointerdown', onDown, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('pointerdown', onDown, true);
    };
  }, [open, hide]);

  useEffect(() => () => cancelHide(), []);

  const child = isValidElement(children)
    ? cloneElement(children, { 'aria-describedby': [children.props['aria-describedby'], `${id}-d`].filter(Boolean).join(' ') })
    : children;

  return (
    <span
      ref={anchor}
      className={cx('inline-flex max-w-full', className)}
      onPointerEnter={(e) => e.pointerType !== 'touch' && show()}
      onPointerLeave={(e) => e.pointerType !== 'touch' && hide()}
      onPointerUp={(e) => {
        if (tapToggle && e.pointerType === 'touch') {
          if (open) hide(true);
          else show();
        }
      }}
      onFocus={(e) => {
        if (keyboardModality && (e.target as HTMLElement).matches?.(':focus-visible')) show();
      }}
      onBlur={() => hide(true)}
    >
      {child}
      <span id={`${id}-d`} hidden>
        {title ? <>{title}. </> : null}
        {content}
      </span>
      {open && !disabled && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={tip}
              role="tooltip"
              id={id}
              onPointerEnter={cancelHide}
              onPointerLeave={() => hide()}
              style={{ left: pos?.x ?? -9999, top: pos?.y ?? -9999 }}
              className={cx(
                'fixed z-[200] max-w-[280px] rounded-lg bg-primary-solid px-3 py-2 text-xs leading-[18px] font-medium text-white shadow-lg',
                'dark:bg-neutral-100 dark:text-neutral-900',
                pos ? 'animate-in fade-in duration-100' : 'opacity-0',
              )}
            >
              {title && <span className="mb-0.5 block font-semibold">{title}</span>}
              <span className="text-white/90 dark:text-neutral-700">{content}</span>
              {kbd && (
                <kbd className="ml-1.5 rounded border border-white/20 px-1 font-body text-[11px] text-white/80 dark:border-neutral-300 dark:text-neutral-600">
                  {kbd}
                </kbd>
              )}
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}

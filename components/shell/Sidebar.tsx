'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, type FC } from 'react';
import { Dialog, Modal, ModalOverlay } from 'react-aria-components';
import { ChevronLeftDouble, Home02, PresentationChart01, XClose } from '@untitledui/icons';
import { cx } from '@/utils/cx';
import { useKeel } from '@/lib/store';
import { useOverlay } from '@/lib/ui-store';
import { useIsMobileNav } from '@/lib/hooks';
import { MODULES, MODULE_ORDER } from '@/lib/modules';
import { contractStatus } from '@/lib/logic/contracts';
import { assess } from '@/lib/logic/tribunal';
import { problemSources } from '@/lib/logic/board';
import type { ModuleId } from '@/lib/types';
import { Tooltip } from '@/components/ui/Tooltip';
import { Button } from '@/components/ui/untitled/base/buttons/button';
import { Logo } from './Logo';

function useNavCounts(): Partial<Record<ModuleId, number>> {
  const data = useKeel((s) => s.data);
  return useMemo(
    () => ({
      contracts: data.contracts.filter((c) => ['due', 'locked'].includes(contractStatus(c))).length,
      ai: data.ai.filter((a) => a.tier === 'prohibited' || a.tier === 'unassessed').length,
      tribunal: data.cases.filter((c) => assess(c, data.settings.qualifyingMonths).level === 'high').length,
      board: problemSources(data.board).length,
    }),
    [data],
  );
}

const COUNT_LABEL: Partial<Record<ModuleId, string>> = {
  contracts: 'with a notice due or missed',
  ai: 'prohibited or not assessed',
  tribunal: 'high-risk cases',
  board: 'data sources need attention',
};

function NavItem({ href, label, Icon, collapsed, count, countLabel, tag, onNavigate }: {
  href: string;
  label: string;
  Icon: FC<{ className?: string }>;
  collapsed: boolean;
  count?: number;
  countLabel?: string;
  tag?: string;
  onNavigate?: () => void;
}) {
  const path = usePathname();
  const active = href === '/' ? path === '/' : path.startsWith(href);
  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      aria-label={collapsed ? label + (count ? `, ${count} ${countLabel}` : '') : undefined}
      className={cx(
        'group relative flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-secondary transition-colors hover:bg-primary_hover',
        active && 'bg-brand-primary_alt text-brand-secondary hover:bg-brand-primary_alt dark:bg-secondary dark:text-primary',
        collapsed && 'justify-center px-0',
      )}
    >
      <Icon className={cx('size-5 shrink-0 text-fg-quaternary', active && 'text-fg-brand-primary dark:text-fg-brand-primary')} aria-hidden />
      {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
      {!collapsed && tag && (
        <span className="rounded-full bg-utility-brand-50 px-2 py-0.5 text-xs font-medium text-utility-brand-700 ring-1 ring-utility-brand-200 ring-inset">{tag}</span>
      )}
      {!collapsed && !!count && (
        <span
          className={cx('rounded-full bg-tertiary px-2 py-0.5 text-xs font-medium text-secondary', active && 'bg-brand-secondary text-brand-secondary dark:bg-tertiary dark:text-secondary')}
          aria-label={`${count} ${countLabel}`}
        >
          {count}
        </span>
      )}
      {collapsed && !!count && <span className="absolute top-1.5 right-2.5 size-2 rounded-full bg-fg-brand-primary ring-2 ring-bg-primary" aria-hidden />}
    </Link>
  );
  return (
    <li>
      {collapsed ? (
        <Tooltip content={label} placement="right" className="flex w-full">
          {link}
        </Tooltip>
      ) : (
        link
      )}
    </li>
  );
}

function NavBody({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const counts = useNavCounts();
  return (
    <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-hide">
      <ul className="mt-2 flex flex-col gap-1">
        <NavItem href="/" label="Home" Icon={Home02} collapsed={collapsed} onNavigate={onNavigate} />
      </ul>
      <p className={cx('mt-6 mb-1.5 px-3 text-xs font-medium text-quaternary', collapsed && 'sr-only')}>Tools</p>
      <ul className={cx('flex flex-col gap-1', collapsed && 'mt-4 border-t border-secondary pt-4')}>
        {MODULE_ORDER.map((id) => (
          <NavItem
            key={id}
            href={MODULES[id].href}
            label={MODULES[id].label}
            Icon={MODULES[id].Icon}
            collapsed={collapsed}
            count={counts[id]}
            countLabel={COUNT_LABEL[id]}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
      <p className={cx('mt-6 mb-1.5 px-3 text-xs font-medium text-quaternary', collapsed && 'sr-only')}>Internal</p>
      <ul className={cx('flex flex-col gap-1', collapsed && 'mt-4 border-t border-secondary pt-4')}>
        <NavItem href="/case-for-keel" label="The case for Keel" Icon={PresentationChart01} collapsed={collapsed} tag="For Harry" onNavigate={onNavigate} />
      </ul>
    </nav>
  );
}

function Footer({ collapsed, showCollapse }: { collapsed: boolean; showCollapse: boolean }) {
  const toggle = useKeel((s) => s.toggleSidebar);
  return (
    <div className={cx('flex items-center gap-2.5 border-t border-secondary p-3', collapsed && 'flex-col')}>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-secondary text-sm font-semibold text-brand-secondary dark:bg-tertiary dark:text-secondary" aria-hidden>
        DA
      </span>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-primary">Dan</p>
          <p className="truncate text-sm text-tertiary">Acme Group · Admin</p>
        </div>
      )}
      {collapsed && <span className="sr-only">Dan, Acme Group · Admin</span>}
      {showCollapse && (
        <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} kbd="[" placement={collapsed ? 'right' : 'top'}>
          <Button
            color="tertiary"
            size="md"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            onPress={toggle}
            iconLeading={<ChevronLeftDouble data-icon className={cx('transition-transform', collapsed && 'rotate-180')} />}
          />
        </Tooltip>
      )}
    </div>
  );
}

export function Sidebar() {
  const mobile = useIsMobileNav();
  const collapsed = useKeel((s) => s.ui.sidebarCollapsed);
  const navOpen = useOverlay((s) => s.navOpen);
  const setOverlay = useOverlay((s) => s.set);
  const close = () => setOverlay({ navOpen: false });

  if (mobile) {
    return (
      <ModalOverlay
        isOpen={navOpen}
        onOpenChange={(o) => setOverlay({ navOpen: o })}
        isDismissable
        className={({ isEntering, isExiting }) =>
          cx('fixed inset-0 z-[90] bg-overlay/50', isEntering && 'animate-in fade-in duration-200', isExiting && 'animate-out fade-out duration-150')
        }
      >
        <Modal
          className={({ isEntering, isExiting }) =>
            cx(
              'fixed inset-y-0 left-0 w-[min(288px,86vw)] bg-primary shadow-xl',
              isEntering && 'animate-in slide-in-from-left duration-200',
              isExiting && 'animate-out slide-out-to-left duration-150',
            )
          }
        >
          <Dialog aria-label="Menu" className="flex h-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] outline-hidden">
            <div className="flex h-16 items-center justify-between px-5">
              <Logo />
              <Button color="tertiary" size="md" iconLeading={XClose} aria-label="Close menu" onPress={close} />
            </div>
            <NavBody collapsed={false} onNavigate={close} />
            <Footer collapsed={false} showCollapse={false} />
          </Dialog>
        </Modal>
      </ModalOverlay>
    );
  }

  return (
    <aside
      aria-label="Sidebar"
      className={cx('flex h-full shrink-0 flex-col border-r border-secondary bg-primary transition-[width] duration-200', collapsed ? 'w-(--sidebar-w-collapsed)' : 'w-(--sidebar-w)')}
    >
      <div className={cx('flex h-18 shrink-0 items-center px-5', collapsed && 'justify-center px-0')}>
        <Link href="/" aria-label="Keel home" className="rounded-lg">
          <Logo collapsed={collapsed} />
        </Link>
      </div>
      <NavBody collapsed={collapsed} />
      <Footer collapsed={collapsed} showCollapse />
    </aside>
  );
}

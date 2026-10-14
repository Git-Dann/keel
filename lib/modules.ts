import type { FC } from 'react';
import { CpuChip01, File06, LayersThree01, Scales02, Target04 } from '@untitledui/icons';
import type { ModuleId } from './types';

export interface ModuleMeta {
  id: ModuleId;
  label: string;
  href: string;
  Icon: FC<{ className?: string }>;
  /** Tailwind classes for solid tiles and dots, from Untitled UI primitives. */
  bg: string;
  text: string;
  /** Ring colour for urgent Horizon dots. */
  ring: string;
  key: string;
}

export const MODULES: Record<ModuleId, ModuleMeta> = {
  contracts: { id: 'contracts', label: 'Contracts', href: '/contracts', Icon: File06, bg: 'bg-module-contracts', text: 'text-module-contracts', ring: 'ring-module-contracts', key: 'C' },
  ai: { id: 'ai', label: 'AI register', href: '/ai', Icon: CpuChip01, bg: 'bg-module-ai', text: 'text-module-ai', ring: 'ring-module-ai', key: 'A' },
  tribunal: { id: 'tribunal', label: 'Tribunal risk', href: '/tribunal', Icon: Scales02, bg: 'bg-module-tribunal', text: 'text-module-tribunal', ring: 'ring-module-tribunal', key: 'T' },
  accounts: { id: 'accounts', label: 'Account research', href: '/accounts', Icon: Target04, bg: 'bg-module-accounts', text: 'text-module-accounts', ring: 'ring-module-accounts', key: 'R' },
  board: { id: 'board', label: 'Board pack', href: '/board', Icon: LayersThree01, bg: 'bg-module-board', text: 'text-module-board', ring: 'ring-module-board', key: 'B' },
};

export const MODULE_ORDER: ModuleId[] = ['contracts', 'ai', 'tribunal', 'accounts', 'board'];

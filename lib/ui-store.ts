'use client';

import { create } from 'zustand';
import type { AiTier } from './types';

/* Non-persisted UI state: toasts and overlays that can be opened from anywhere. */

export type ToastTone = 'success' | 'warning' | 'error';
export interface Toast {
  id: number;
  title: string;
  body?: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: Toast[];
  push: (title: string, body?: string, tone?: ToastTone) => void;
  dismiss: (id: number) => void;
}

let tid = 0;
export const useToasts = create<ToastState>()((set) => ({
  toasts: [],
  push: (title, body, tone = 'success') => {
    const id = ++tid;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, title, body, tone }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 5000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = (title: string, body?: string, tone?: ToastTone) => useToasts.getState().push(title, body, tone);

export interface WizardState {
  step: 1 | 2 | 3;
  /** Set when reassessing an existing tool. */
  toolId?: string;
  fromTier?: AiTier;
}

interface OverlayState {
  paletteOpen: boolean;
  navOpen: boolean;
  uploadOpen: boolean;
  wizard: WizardState | null;
  boardBuilding: boolean;
  resetConfirmOpen: boolean;
  /** Bumped on reset so pages drop any local state. */
  resetCount: number;
  set: (p: Partial<Omit<OverlayState, 'set'>>) => void;
}

export const useOverlay = create<OverlayState>()((set) => ({
  paletteOpen: false,
  navOpen: false,
  uploadOpen: false,
  wizard: null,
  boardBuilding: false,
  resetConfirmOpen: false,
  resetCount: 0,
  set: (p) => set(p),
}));

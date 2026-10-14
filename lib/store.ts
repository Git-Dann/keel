'use client';

import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { useMemo } from 'react';
import { differenceInCalendarDays, addDays, format } from 'date-fns';
import type { ActivityEvent, AiTier, AiTool, ChatMessage, Contract, HrCase, Prospect, Settings, TrayTab, WorkspaceData } from './types';
import { seedActivity, seedWorkspace } from './seed';
import { isoInDays, parseDate, today } from './format';
import { buildAlerts, visibleAlerts } from './logic/alerts';
import { paperworkFromDuties, reassess, TIER_META, withSeededDuties } from './logic/ai';
import { assess, LEVEL_META, nextRef, serviceOf, type CaseDraft } from './logic/tribunal';
import { answer } from './logic/askKeel';

export const STORAGE_KEY = 'keel-demo-v1';
const MAX_ACTIVITY = 60;
const MAX_CHAT = 30;

/* ---------- Storage that never throws (private mode, blocked site data) ---------- */

const memory = new Map<string, string>();
export const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return window.localStorage.getItem(k);
    } catch {
      return memory.get(k) ?? null;
    }
  },
  setItem: (k, v) => {
    try {
      window.localStorage.setItem(k, v);
    } catch {
      memory.set(k, v);
    }
  },
  removeItem: (k) => {
    try {
      window.localStorage.removeItem(k);
    } catch {
      memory.delete(k);
    }
  },
};

/* ---------- State ---------- */

export interface UiState {
  sidebarCollapsed: boolean;
  trayOpen: boolean;
  trayTab: TrayTab;
  hiddenTips: string[];
  dismissedAlerts: string[];
}

interface Persisted {
  data: WorkspaceData;
  seededOn: string;
  ui: UiState;
  activity: ActivityEvent[];
  chat: ChatMessage[];
}

export interface KeelState extends Persisted {
  log: (source: string, message: string) => void;
  resetDemo: () => void;

  toggleSidebar: () => void;
  setTray: (open: boolean, tab?: TrayTab) => void;
  /** Clicking a tab opens it, clicking the active tab closes the tray. */
  clickTrayTab: (tab: TrayTab) => void;
  hideTip: (key: string) => void;
  showTips: () => void;
  dismissAlert: (id: string) => void;
  ask: (q: string) => void;

  addContract: (c: Contract) => void;
  markChecked: (id: string) => 'ok' | 'no-date' | 'missing';
  setReminder: (id: string) => void;

  seedToolDuties: (id: string) => void;
  toggleDuty: (id: string, index: number, done: boolean) => void;
  addTool: (t: AiTool) => void;
  reassessTool: (id: string, tier: AiTier) => void;

  setQualifying: (m: Settings['qualifyingMonths']) => void;
  saveCase: (d: CaseDraft) => HrCase;
  closeCase: (id: string) => void;

  markBriefed: (p: Prospect) => void;

  syncAll: () => void;
  syncSource: (id: string) => void;
  connectSource: (id: string) => void;
  toggleSection: (id: string, included: boolean) => void;
  buildDraft: () => void;
  editDraft: (sectionId: string, text: string) => void;
  sendPack: (withNote: boolean) => void;
}

const freshUi = (): UiState => ({ sidebarCollapsed: false, trayOpen: false, trayTab: 'activity', hiddenTips: [], dismissedAlerts: [] });

const fresh = (): Persisted => ({
  data: seedWorkspace(),
  seededOn: isoInDays(0),
  ui: freshUi(),
  activity: seedActivity(),
  chat: [],
});

let uid = 0;
export const newId = (prefix: string) => `${prefix}${Date.now().toString(36)}${(uid++).toString(36)}`;

/**
 * Keep the demo fresh: if the workspace was seeded on an earlier day,
 * move every stored date forward by the same number of days.
 */
export function shiftToToday(p: Persisted, base: Date = today()): Persisted {
  const delta = differenceInCalendarDays(base, parseDate(p.seededOn));
  if (!delta) return p;
  const shift = (iso: string | null) => (iso ? format(addDays(parseDate(iso), delta), 'yyyy-MM-dd') : iso);
  return {
    ...p,
    seededOn: format(base, 'yyyy-MM-dd'),
    data: { ...p.data, contracts: p.data.contracts.map((c) => ({ ...c, renews: shift(c.renews) })) },
  };
}

export const useKeel = create<KeelState>()(
  persist(
    (set, get) => {
      const log = (source: string, message: string) =>
        set((s) => ({ activity: [{ at: new Date().toISOString(), source, message }, ...s.activity].slice(0, MAX_ACTIVITY) }));

      const setData = (fn: (d: WorkspaceData) => Partial<WorkspaceData>) => set((s) => ({ data: { ...s.data, ...fn(s.data) } }));
      const setBoard = (fn: (b: WorkspaceData['board']) => Partial<WorkspaceData['board']>) =>
        setData((d) => ({ board: { ...d.board, ...fn(d.board) } }));

      return {
        ...fresh(),
        log,
        resetDemo: () => set({ ...fresh() }),

        toggleSidebar: () => set((s) => ({ ui: { ...s.ui, sidebarCollapsed: !s.ui.sidebarCollapsed } })),
        setTray: (open, tab) => set((s) => ({ ui: { ...s.ui, trayOpen: open, trayTab: tab ?? s.ui.trayTab } })),
        clickTrayTab: (tab) =>
          set((s) => ({ ui: { ...s.ui, trayOpen: !(s.ui.trayOpen && s.ui.trayTab === tab), trayTab: tab } })),
        hideTip: (key) => set((s) => ({ ui: { ...s.ui, hiddenTips: [...new Set([...s.ui.hiddenTips, key])] } })),
        showTips: () => set((s) => ({ ui: { ...s.ui, hiddenTips: [] } })),
        dismissAlert: (id) => set((s) => ({ ui: { ...s.ui, dismissedAlerts: [...new Set([...s.ui.dismissedAlerts, id])] } })),
        ask: (q) => {
          const a = answer(q, get().data);
          set((s) => ({
            chat: [
              ...s.chat,
              { id: newId('m'), from: 'me' as const, text: q },
              { id: newId('m'), from: 'keel' as const, text: a.text, items: a.items },
            ].slice(-MAX_CHAT),
          }));
        },

        addContract: (c) => {
          setData((d) => ({ contracts: [c, ...d.contracts] }));
          log('Contracts', `Extracted "${c.name}"`);
        },
        markChecked: (id) => {
          const c = get().data.contracts.find((x) => x.id === id);
          if (!c) return 'missing';
          if (!c.renews) return 'no-date';
          setData((d) => ({ contracts: d.contracts.map((x) => (x.id === id ? { ...x, lowConfidence: [], reviewed: true } : x)) }));
          log('Contracts', `Checked terms on ${c.name}`);
          return 'ok';
        },
        setReminder: (id) => {
          const c = get().data.contracts.find((x) => x.id === id);
          if (!c) return;
          setData((d) => ({ contracts: d.contracts.map((x) => (x.id === id ? { ...x, reminderSet: true } : x)) }));
          log('Contracts', `Reminder set for ${c.name}`);
        },

        seedToolDuties: (id) => {
          const t = get().data.ai.find((x) => x.id === id);
          if (!t || t.dutiesSeeded) return;
          setData((d) => ({ ai: d.ai.map((x) => (x.id === id ? withSeededDuties(x) : x)) }));
        },
        toggleDuty: (id, index, done) => {
          const t = get().data.ai.find((x) => x.id === id);
          if (!t) return;
          const dutiesDone = { ...withSeededDuties(t).dutiesDone, [index]: done };
          const paperwork = paperworkFromDuties(dutiesDone, t.tier);
          setData((d) => ({ ai: d.ai.map((x) => (x.id === id ? { ...x, dutiesDone, dutiesSeeded: true, paperwork } : x)) }));
          log('AI register', `${t.name} paperwork now ${paperwork}%`);
        },
        addTool: (t) => {
          setData((d) => ({ ai: [t, ...d.ai] }));
          log('AI register', `Added ${t.name} as ${TIER_META[t.tier].label.toLowerCase()}`);
        },
        reassessTool: (id, tier) => {
          const t = get().data.ai.find((x) => x.id === id);
          if (!t) return;
          setData((d) => ({ ai: d.ai.map((x) => (x.id === id ? reassess(withSeededDuties(x), tier) : x)) }));
          log('AI register', `${t.name} reassessed as ${TIER_META[tier].label.toLowerCase()}`);
        },

        setQualifying: (m) => {
          setData((d) => ({ settings: { ...d.settings, qualifyingMonths: m } }));
          log('Tribunal risk', `Qualifying period set to ${m === 0 ? 'day-one rights' : m === 6 ? '6 months' : '2 years'}`);
        },
        saveCase: (dr) => {
          const d = get().data;
          const existing = dr.id ? d.cases.find((c) => c.id === dr.id) : undefined;
          const c: HrCase = {
            id: existing?.id ?? newId('t'),
            ref: existing?.ref ?? nextRef(d.cases),
            initials: dr.initials.trim().slice(0, 6),
            kind: dr.kind,
            serviceMonths: serviceOf(dr),
            stage: dr.stage,
            stageInDays: dr.stageInDays,
            answers: { ...dr.answers, warnings: dr.kind === 'conduct' || dr.kind === 'capability' ? dr.answers.warnings : 'na' },
          };
          setData((x) => ({ cases: existing ? x.cases.map((y) => (y.id === c.id ? c : y)) : [...x.cases, c] }));
          const level = LEVEL_META[assess(c, d.settings.qualifyingMonths).level].label.toLowerCase();
          log('Tribunal risk', existing ? `Updated ${c.ref}, now ${level}` : `New check ${c.ref}, ${level}`);
          return c;
        },
        closeCase: (id) => {
          const c = get().data.cases.find((x) => x.id === id);
          if (!c) return;
          setData((d) => ({ cases: d.cases.filter((x) => x.id !== id) }));
          log('Tribunal risk', `Closed ${c.ref}`);
        },

        markBriefed: (p) => {
          setData((d) => ({
            prospects: d.prospects.some((x) => x.id === p.id)
              ? d.prospects.map((x) => (x.id === p.id ? { ...x, briefedDaysAgo: 0 } : x))
              : [...d.prospects, { ...p, briefedDaysAgo: 0 }],
          }));
          log('Account research', `Briefing built for ${p.name}`);
        },

        syncAll: () => {
          setBoard((b) => ({ sources: b.sources.map((s) => (s.status === 'stale' || s.status === 'ok' ? { ...s, status: 'ok', hoursSinceSync: 0 } : s)) }));
          log('Board pack', 'Synced all connected sources');
        },
        syncSource: (id) => {
          const s = get().data.board.sources.find((x) => x.id === id);
          setBoard((b) => ({ sources: b.sources.map((x) => (x.id === id ? { ...x, status: 'ok', hoursSinceSync: 0 } : x)) }));
          if (s) log('Board pack', `${s.vendor} synced`);
        },
        connectSource: (id) => {
          const s = get().data.board.sources.find((x) => x.id === id);
          setBoard((b) => ({ sources: b.sources.map((x) => (x.id === id ? { ...x, status: 'ok', hoursSinceSync: 0 } : x)) }));
          if (s) log('Board pack', `${s.vendor} connected`);
        },
        toggleSection: (id, included) => setBoard((b) => ({ sections: b.sections.map((s) => (s.id === id ? { ...s, included } : s)) })),
        buildDraft: () => {
          const rebuilt = !!get().data.board.draft;
          setBoard(() => ({ draft: { builtAt: new Date().toISOString(), edits: {} } }));
          log('Board pack', rebuilt ? 'Draft pack rebuilt' : 'Draft pack built');
        },
        editDraft: (sectionId, text) =>
          setBoard((b) => (b.draft ? { draft: { ...b.draft, edits: { ...b.draft.edits, [sectionId]: text } } } : {})),
        sendPack: (withNote) => {
          setBoard(() => ({ sentAt: new Date().toISOString() }));
          log('Board pack', withNote ? 'Sent to board with a note on provisional data' : 'Sent to board');
        },
      };
    },
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: (s): Persisted => ({ data: s.data, seededOn: s.seededOn, ui: s.ui, activity: s.activity, chat: s.chat }),
      merge: (persisted, current) => {
        const p = persisted as Persisted | undefined;
        if (!p || !p.data || !p.seededOn) return current;
        const shifted = shiftToToday({ ...p, ui: { ...freshUi(), ...p.ui } });
        return { ...current, ...shifted };
      },
    },
  ),
);

/* ---------- Derived selectors ---------- */

export function useAllAlerts() {
  const data = useKeel((s) => s.data);
  return useMemo(() => buildAlerts(data), [data]);
}

export function useAlerts() {
  const all = useAllAlerts();
  const dismissed = useKeel((s) => s.ui.dismissedAlerts);
  return useMemo(() => visibleAlerts(all, dismissed), [all, dismissed]);
}

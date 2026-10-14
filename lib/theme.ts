'use client';

import { useCallback, useSyncExternalStore } from 'react';

export const THEME_KEY = 'keel-theme';
export type Theme = 'light' | 'dark';

/** Runs in <head> before first paint so there is no flash of the wrong theme. */
export const themeScript = `(function(){var d=document.documentElement,t=null;try{t=localStorage.getItem('${THEME_KEY}')}catch(e){}if(t!=='light'&&t!=='dark'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.dataset.theme=t;d.style.colorScheme=t})();`;

const listeners = new Set<() => void>();
const read = (): Theme => (typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

export function setTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  document.documentElement.style.colorScheme = t;
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch {
    /* storage blocked: the choice lasts for this visit */
  }
  listeners.forEach((l) => l());
}

export function useTheme() {
  const theme = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => 'light' as Theme,
  );
  const toggle = useCallback(() => setTheme(read() === 'dark' ? 'light' : 'dark'), []);
  return { theme, toggle };
}

export const toggleTheme = () => setTheme(read() === 'dark' ? 'light' : 'dark');

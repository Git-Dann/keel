'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useKeel } from './store';

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useIsMobileNav = () => useMediaQuery('(max-width: 859.98px)');

/** Rehydrates the persisted store once on the client and reports when it is ready. */
export function useHydrated() {
  const ready = useSyncExternalStore(
    (cb) => useKeel.persist.onFinishHydration(cb),
    () => useKeel.persist.hasHydrated(),
    () => false,
  );
  useEffect(() => {
    if (!useKeel.persist.hasHydrated()) void useKeel.persist.rehydrate();
  }, []);
  return ready;
}

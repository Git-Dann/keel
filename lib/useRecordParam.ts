'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from './ui-store';

/**
 * Reads ?open=<id> so a record is linkable and survives refresh.
 * An unknown id shows a warning toast and drops the parameter.
 */
export function useRecordParam(exists: (id: string) => boolean, notFound: string) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const id = params.get('open');
  const valid = id && exists(id) ? id : null;
  const warned = useRef<string | null>(null);

  useEffect(() => {
    if (id && !exists(id) && warned.current !== id) {
      warned.current = id;
      toast(notFound, 'It may have been removed. Showing the full list instead.', 'warning');
      router.replace(pathname, { scroll: false });
    }
  }, [id, exists, notFound, router, pathname]);

  const open = useCallback((next: string) => router.push(`${pathname}?open=${encodeURIComponent(next)}`, { scroll: false }), [router, pathname]);
  const close = useCallback(() => router.replace(pathname, { scroll: false }), [router, pathname]);

  return { openId: valid, open, close };
}

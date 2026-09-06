import {useEffect, useRef} from 'react';

/** Ceiling for admin live polls — one in-flight request, pause when the tab is hidden. */
export const LIVE_REFRESH_MS = 5_000;

export function mergeByIdFront<T extends {id: string}>(current: T[], incoming: T[]): T[] {
  const incomingIds = new Set(incoming.map(item => item.id));
  return [...incoming, ...current.filter(item => !incomingIds.has(item.id))];
}

/**
 * Silently re-run `refresh` at most every 5s while this view is mounted and visible.
 * The view still does its own first load; this only keeps data current afterwards.
 */
export function useLiveRefresh(refresh: () => void | Promise<void>, enabled = true): void {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const inFlight = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;

    const run = async (): Promise<void> => {
      if (cancelled || inFlight.current || document.hidden) {
        return;
      }
      inFlight.current = true;
      try {
        await refreshRef.current();
      } catch {
        // Keep the last good snapshot; the view's explicit load still surfaces errors.
      } finally {
        inFlight.current = false;
      }
    };

    const interval = window.setInterval(() => {
      void run();
    }, LIVE_REFRESH_MS);

    const onVisibility = (): void => {
      if (!document.hidden) {
        void run();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled]);
}

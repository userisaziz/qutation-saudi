import { useCallback, useSyncExternalStore } from 'react';

/**
 * One media query, subscribed once per caller. Used where two layouts differ
 * enough that rendering both and hiding one would double the DOM — tables,
 * principally. `matchMedia` is an external store, so it goes through
 * `useSyncExternalStore` rather than an effect that mirrors a value into state.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onStoreChange);
      return () => list.removeEventListener('change', onStoreChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    // No server render in this build; the client snapshot wins on hydration.
    () => false,
  );
}

/** 60rem — the width at which the rail becomes a sheet and tables stack. */
export const useIsCompact = () => !useMediaQuery('(min-width: 60rem)');

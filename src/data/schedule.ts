import { RATE_SCHEDULE } from '@/domain/catalog';
import type { AddedRate, RateRow } from '@/domain/types';

/**
 * A contract's rate schedule as it stands this session: the imported v1 lines
 * plus every rate an Admin has published on top. Both are pure — the store
 * holds `adds`, these read it — which is why they live beside the seed rather
 * than in the provider, where a non-component export would break fast refresh.
 */

/** Rates published this session for one contract, keyed by the five-position identity. */
export function publishedMap(adds: Record<string, AddedRate>, cid: string): Record<string, number> {
  const out: Record<string, number> = {};
  Object.entries(adds).forEach(([k, a]) => {
    if (k.startsWith(`${cid}|`)) out[k.slice(cid.length + 1)] = a.rate;
  });
  return out;
}

export function scheduleOf(adds: Record<string, AddedRate>, cid: string): RateRow[] {
  const extra: RateRow[] = Object.entries(adds)
    .filter(([k]) => k.startsWith(`${cid}|`))
    .map(([k, a]) => {
      const [cat, model, size, rating, svc] = k.slice(cid.length + 1).split('|');
      return { cat, model, size, rating, svc, rate: a.rate, ver: a.ver };
    });
  return RATE_SCHEDULE[cid].concat(extra);
}

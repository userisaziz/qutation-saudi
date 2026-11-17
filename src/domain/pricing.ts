import { DN, SIZES, lookupRate } from '@/domain/catalog';
import { daysBetween, num, parseDate, withinTerm } from '@/domain/format';
import type { Contract, Identity, Line, Quote, Totals, Valve } from '@/domain/types';

export const keyOf = (l: Identity) => [l.cat, l.model, l.size, l.rating, l.svc].join('|');

export const blankValves = (qty: number): Valve[] =>
  Array.from({ length: qty }, () => ({ tag: '', serial: '' }));

export function fitValves(existing: Valve[], qty: number): Valve[] {
  return Array.from({ length: qty }, (_, i) => existing[i] ?? { tag: '', serial: '' });
}

/** Resolve the contract rate for an identity. undefined = not fully chosen, null = not contracted. */
export function resolveRate(
  c: Contract,
  id: Identity,
  published: Record<string, number>,
): number | null | undefined {
  if (!id.cat || !id.model || !id.size || !id.rating || !id.svc) return undefined;
  const added = published[keyOf(id)];
  if (added) return added;
  return lookupRate(c, id.cat, id.model, id.size, id.rating, id.svc);
}

export function totals(q: Quote): Totals {
  let sub = 0;
  let lx = 0;
  let nc = 0;
  let valves = 0;
  let miss = 0;
  let priced = 0;
  q.lines.forEach((l) => {
    const ex = l.extras.reduce((a, e) => a + num(e.amount), 0);
    if (l.rate != null) lx += ex;
    valves += l.qty;
    miss += l.valves.filter((v) => !v.tag).length;
    if (l.rate == null) nc += 1;
    else {
      priced += 1;
      sub += l.rate * l.qty;
    }
  });
  const qx = q.qx.reduce((a, e) => a + num(e.amount), 0);
  return { sub, lx, qx, nc, valves, miss, priced, grand: sub + lx + qx };
}

export interface GapGroup {
  cid: string;
  key: string;
  line: Line;
  quoteNos: string[];
  quoteIds: string[];
  valves: number;
  lines: number;
  oldest: string;
}

export function groupGaps(drafts: Quote[]): GapGroup[] {
  const groups: Record<string, GapGroup> = {};
  drafts.forEach((q) =>
    q.lines.forEach((l) => {
      if (l.rate != null) return;
      const gk = `${q.cid}|${keyOf(l)}`;
      const g =
        groups[gk] ??
        (groups[gk] = {
          cid: q.cid,
          key: keyOf(l),
          line: l,
          quoteNos: [],
          quoteIds: [],
          valves: 0,
          lines: 0,
          oldest: q.createdAt,
        });
      if (!g.quoteNos.includes(q.no)) {
        g.quoteNos.push(q.no);
        g.quoteIds.push(q.id);
      }
      g.valves += l.qty;
      g.lines += 1;
      if ((parseDate(q.createdAt)?.getTime() ?? 0) < (parseDate(g.oldest)?.getTime() ?? 0))
        g.oldest = q.createdAt;
    }),
  );
  return Object.values(groups);
}

export const TODAY = '25/10/26';

export const ageOf = (since: string) => (parseDate(since) ? daysBetween(since, TODAY) : 0);

export const sizeText = (size: string) => `${size} · ${DN[SIZES.indexOf(size)] || ''}`;

export const withinTermOf = (c: Contract, s: string) => withinTerm(c.start, c.end, s);

/**
 * What still blocks a draft, in the words shown in the quotations list.
 * The second element is a tone name, not a colour — presentation belongs to
 * the UI layer (`config/tones.ts` maps it to a class).
 */
export type GapTone = 'muted' | 'warn' | 'live';

export function gapSummary(q: Quote): [string, GapTone] {
  const t = totals(q);
  if (q.status !== 'Draft') return ['—', 'muted'];
  const parts: string[] = [];
  if (t.nc) parts.push(`${t.nc} not contracted`);
  if (t.miss) parts.push(`${t.miss} tags missing`);
  if (!q.lines.length) parts.push('No lines');
  if (!parts.length) return ['Ready', 'live'];
  return [parts.join(' · '), 'warn'];
}

/** A line is priced off its contract rate plus its own additional costs. */
export const lineTotal = (l: Line) =>
  l.rate == null ? null : l.rate * l.qty + l.extras.reduce((a, e) => a + num(e.amount), 0);

export const lineCosts = (l: Line) => l.extras.reduce((a, e) => a + num(e.amount), 0);

export const taggedCount = (l: Line) => l.valves.filter((v) => v.tag).length;

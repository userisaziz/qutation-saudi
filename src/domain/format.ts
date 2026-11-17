export const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const num = (x: string | number) => parseFloat(String(x).replace(/[^0-9.]/g, '')) || 0;

const pad = (n: number) => String(n).padStart(2, '0');

/** DD/MM/YY — the format used on customer documents. */
export function parseDate(s: string): Date | null {
  const m = /^(\d\d)\/(\d\d)\/(\d\d)$/.exec((s || '').trim());
  return m ? new Date(2000 + Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null;
}

export const formatDate = (d: Date) =>
  `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`;

export function addDays(s: string, n: number): string {
  const d = parseDate(s);
  if (!d) return '—';
  d.setDate(d.getDate() + n);
  return formatDate(d);
}

export function daysBetween(a: string, b: string): number {
  const da = parseDate(a);
  const db = parseDate(b);
  if (!da || !db) return 0;
  return Math.round((db.getTime() - da.getTime()) / 864e5);
}

export const withinTerm = (start: string, end: string, s: string) => {
  const d = parseDate(s);
  const a = parseDate(start);
  const b = parseDate(end);
  return !!d && !!a && !!b && d >= a && d <= b;
};

export const dottedDate = (s: string) => {
  const d = parseDate(s);
  return d ? `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}` : s;
};

export const inches = (size: string) => size.replace(' x ', '"x') + '"';

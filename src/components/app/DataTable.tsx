import type { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

/**
 * One table, two layouts.
 *
 * Wide screens get the real `<table>`: 2px ink head rule, hair row dividers,
 * fixed widths so the money columns line up. Narrow screens get the same rows
 * as bordered blocks, because a nine-column rate schedule squeezed into 390px
 * is unreadable — a row collapses to its primary cell plus the figures a
 * decision actually needs.
 *
 * A row is only focusable when `onRow` makes it actionable.
 */

export type MobileRole = 'primary' | 'figure' | 'meta' | 'hide';

export interface Column<T> {
  key: string;
  header: string;
  /** Cell contents. Keep it cheap — this runs per row, per render. */
  cell: (row: T, index: number) => ReactNode;
  /** Width and alignment on the wide layout, e.g. `w-24 text-right`. */
  width?: string;
  /** What the row shows on a phone. Defaults to `meta`. */
  mobile?: MobileRole;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string | number;
  onRow?: (row: T) => void;
  /** Marks the row that just changed; the journal gives it a clay edge. */
  isLive?: (row: T) => boolean;
  caption?: string;
  empty?: ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRow,
  isLive,
  caption,
  empty,
}: DataTableProps<T>) {
  const compact = useIsCompact();

  if (!rows.length) return <>{empty ?? null}</>;

  if (compact) {
    return (
      <ul className="flex flex-col gap-px overflow-hidden rounded-lg border border-rule bg-rule">
        {rows.map((row, i) => {
          const visible = columns.filter((c) => c.mobile !== 'hide');
          const primary = visible.find((c) => c.mobile === 'primary') ?? visible[0];
          const figures = visible.filter((c) => c.mobile === 'figure');
          const meta = visible.filter((c) => c.mobile === 'meta' && c !== primary);
          const live = isLive?.(row);

          const body = (
            <>
              <span className="block text-md leading-tight font-extrabold">
                {primary.cell(row, i)}
              </span>
              {figures.length > 0 && (
                <span className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1.5">
                  {figures.map((c) => (
                    <span key={c.key} className="flex flex-col">
                      <span className="text-2xs text-ink-3">{c.header}</span>
                      <span className="font-extrabold">{c.cell(row, i)}</span>
                    </span>
                  ))}
                </span>
              )}
              {meta.length > 0 && (
                <span className="mt-1.5 flex flex-col gap-0.5 text-xs text-ink-3">
                  {meta.map((c) => (
                    <span key={c.key}>
                      {c.header}: {c.cell(row, i)}
                    </span>
                  ))}
                </span>
              )}
            </>
          );

          return (
            <li
              key={rowKey(row, i)}
              className={cn('bg-paper-3', live && 'border-l-4 border-l-clay')}
            >
              {onRow ? (
                <button
                  type="button"
                  onClick={() => onRow(row)}
                  className="block w-full cursor-pointer px-3 py-3 text-left"
                >
                  {body}
                </button>
              ) : (
                <div className="px-3 py-3">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-rule bg-paper-3 shadow-card">
      <Table className="table-fixed">
        {caption && <TableCaption className="text-left">{caption}</TableCaption>}
        <TableHeader>
          <TableRow className="border-b border-b-rule hover:bg-transparent">
            {columns.map((c) => (
              <TableHead key={c.key} className={cn('h-9 px-3 text-xs text-ink-3', c.width)}>
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => {
            const live = isLive?.(row);
            return (
              <TableRow
                key={rowKey(row, i)}
                className={cn(
                  'border-b border-rule hover:bg-paper-2',
                  onRow && 'cursor-pointer',
                  live && 'bg-amber-soft',
                )}
                onClick={onRow ? () => onRow(row) : undefined}
                tabIndex={onRow ? 0 : undefined}
                onKeyDown={
                  onRow
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRow(row);
                        }
                      }
                    : undefined
                }
              >
                {columns.map((c) => (
                  <TableCell key={c.key} className={cn('px-3 py-2 align-middle', c.width)}>
                    {c.cell(row, i)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

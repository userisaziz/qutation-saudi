import { useMemo } from 'react';
import { DataTable } from '@/components/app/DataTable';
import type { Column } from '@/components/app/DataTable';
import { Icon } from '@/components/app/Icon';
import { IdentityKey } from '@/components/app/IdentityKey';
import { Plate, PlateRow } from '@/components/app/Plate';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { CONTRACT_BY_ID, dnOf } from '@/domain/catalog';
import { ageOf, groupGaps } from '@/domain/pricing';
import type { GapGroup } from '@/domain/pricing';
import { usePortal } from '@/state/portal';
import { cn } from '@/lib/utils';

/**
 * The Admin rate queue: one item per combination of the five identity
 * positions that has no contract rate, gathered across every draft quotation
 * that needs it. Publishing a rate for an item fills every blank line on that
 * contract's drafts at once.
 */

/** Age decides the signal: over a week is a breach, over two days is a wait. */
const ageTone = (age: number) =>
  age > 7 ? 'text-bad' : age > 2 ? 'border border-amber bg-amber-soft text-ink' : 'text-ink-3';

const gapColumns = (onOpen: (group: GapGroup) => void): Column<GapGroup>[] => [
  {
    key: 'contract',
    header: 'Contract',
    width: 'w-44',
    mobile: 'meta',
    cell: (g) => {
      const c = CONTRACT_BY_ID[g.cid];
      return (
        <span className="flex flex-col">
          <span className="truncate text-sm font-extrabold">{c.customer}</span>
          <span className="text-xs text-ink-3">{c.ct}</span>
        </span>
      );
    },
  },
  {
    key: 'identity',
    header: 'Missing combination',
    mobile: 'primary',
    cell: (g) => (
      <span className="flex flex-col items-start gap-1">
        <IdentityKey identity={g.line} />
        <span className="text-2xs text-ink-3">{dnOf(g.line.size)}</span>
      </span>
    ),
  },
  {
    key: 'quotes',
    header: 'Waiting quotations',
    width: 'w-40',
    mobile: 'meta',
    cell: (g) => <span className="block break-words text-ink-3">{g.quoteNos.join(', ')}</span>,
  },
  {
    key: 'valves',
    header: 'Valves',
    width: 'w-20 text-right',
    mobile: 'figure',
    cell: (g) => <span className="font-extrabold">{g.valves}</span>,
  },
  {
    key: 'age',
    header: 'Open for',
    width: 'w-28',
    mobile: 'figure',
    cell: (g) => {
      const age = ageOf(g.oldest);
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-1 py-0.5 text-sm leading-none font-extrabold',
            ageTone(age),
          )}
        >
          <Icon id="ic-age" size={13} />
          {age} {age === 1 ? 'day' : 'days'}
        </span>
      );
    },
  },
  {
    key: 'open',
    header: 'Open',
    width: 'w-40 text-right',
    mobile: 'figure',
    cell: (g) => (
      <Button type="button" variant="outline" size="sm" onClick={() => onOpen(g)}>
        Open quotation
      </Button>
    ),
  },
];

export default function RateQueue() {
  const { state, actions } = usePortal();

  const groups = useMemo(
    () =>
      groupGaps(state.quotes.filter((q) => q.status === 'Draft')).sort(
        (a, b) => ageOf(b.oldest) - ageOf(a.oldest),
      ),
    [state.quotes],
  );

  const columns = useMemo(
    () => gapColumns((g) => actions.openGap(g.cid, g.key, g.quoteIds[0])),
    [actions],
  );

  const blocked = useMemo(() => new Set(groups.flatMap((g) => g.quoteIds)).size, [groups]);

  const oldest = groups.length ? Math.max(...groups.map((g) => ageOf(g.oldest))) : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
      <p className="max-w-[46rem] text-sm text-ink-3">
        One item per missing combination per contract, however many quotations need it. Open the
        quotation to enter the rate; publishing fills every blank line on that contract’s draft
        quotations.
      </p>

      <PlateRow className="grid-cols-1 sm:grid-cols-3">
        <Plate label="Open gaps" value={groups.length} emphasis className="border-0" />
        <Plate label="Blocked quotations" value={blocked} className="border-0" />
        <Plate
          label="Oldest open"
          value={oldest === null ? '—' : `${oldest} days`}
          className="border-0"
        />
      </PlateRow>

      <DataTable
        columns={columns}
        rows={groups}
        rowKey={(g) => `${g.cid}|${g.key}`}
        empty={
          <Empty className="border border-rule bg-paper-3">
            <EmptyHeader>
              <EmptyTitle>Queue is clear</EmptyTitle>
              <EmptyDescription>
                Every line on every draft quotation has a contract rate.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
      />
    </div>
  );
}

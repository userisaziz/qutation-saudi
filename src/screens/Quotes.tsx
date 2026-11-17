import { useMemo } from 'react';
import { DataTable } from '@/components/app/DataTable';
import type { Column } from '@/components/app/DataTable';
import { Icon } from '@/components/app/Icon';
import { Money } from '@/components/app/Money';
import { StatusPill } from '@/components/app/StatusPill';
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QUOTE_TONE } from '@/config/tones';
import { CONTRACTS, CONTRACT_BY_ID } from '@/domain/catalog';
import { gapSummary, totals } from '@/domain/pricing';
import { usePortal } from '@/state/portal';
import type { Quote } from '@/domain/types';

/**
 * The quotations list: every work-order quotation, with what still blocks it.
 * A draft that carries an unpriced line shows it here as an open gap, so an
 * estimator sees the count before opening the quotation.
 * Filter by contract, then by status; a row opens the editor for that quote.
 */

const TABS = ['All', 'Draft', 'Finalised', 'Closed'];

/** Radix selects cannot hold an empty value, so "all" stands in for `''`. */
const ALL_CONTRACTS = 'all';

/** What still stops this draft, in the domain's own words and one signal. */
function GapFlag({ quote }: { quote: Quote }) {
  const [text] = gapSummary(quote);
  const t = totals(quote);
  const blocked = t.nc > 0 || t.miss > 0 || quote.lines.length === 0;

  if (quote.status !== 'Draft') {
    return <span className="text-sm text-ink-3">{text}</span>;
  }
  if (blocked) {
    return (
      <span className="inline-flex items-center gap-1.5 border border-amber bg-amber px-1.5 py-0.5 text-xs leading-none font-medium break-words text-ink">
        <Icon id="ic-not-contracted" size={13} />
        {text}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs leading-none font-medium text-good">
      <Icon id="ic-rate-locked" size={13} />
      {text}
    </span>
  );
}

const COLUMNS: Column<Quote>[] = [
  {
    key: 'no',
    header: 'Quotation',
    width: 'w-36',
    mobile: 'primary',
    cell: (q) => <span className="text-sm font-extrabold">{q.no}</span>,
  },
  {
    key: 'customer',
    header: 'Customer',
    width: 'w-40',
    mobile: 'meta',
    cell: (q) => <span className="block truncate">{CONTRACT_BY_ID[q.cid].customer}</span>,
  },
  {
    key: 'wo',
    header: 'WO',
    width: 'w-28',
    mobile: 'meta',
    cell: (q) => <span className="block truncate">{q.hdr.wo || '—'}</span>,
  },
  {
    key: 'evmc',
    header: 'EVMC',
    width: 'w-28',
    mobile: 'meta',
    cell: (q) => <span className="block truncate text-ink-3">{q.hdr.evmc || '—'}</span>,
  },
  {
    key: 'issued',
    header: 'Issued',
    width: 'w-24',
    mobile: 'meta',
    cell: (q) => <span className="block text-ink-3">{q.hdr.date}</span>,
  },
  {
    key: 'gaps',
    header: 'Open gaps',
    mobile: 'figure',
    cell: (q) => <GapFlag quote={q} />,
  },
  {
    key: 'total',
    header: 'Total (SAR)',
    width: 'w-32 text-right',
    mobile: 'figure',
    cell: (q) => <Money value={totals(q).grand} currency={false} size="sm" />,
  },
  {
    key: 'status',
    header: 'Status',
    width: 'w-28',
    mobile: 'figure',
    cell: (q) => <StatusPill tone={QUOTE_TONE[q.status]} label={q.status} />,
  },
];

export default function Quotes() {
  const { state, actions } = usePortal();
  const { cid, st } = state.qlf;

  const byContract = useMemo(
    () => (cid ? state.quotes.filter((q) => q.cid === cid) : state.quotes),
    [cid, state.quotes],
  );

  const rows = useMemo(
    () => (st === 'All' ? byContract : byContract.filter((q) => q.status === st)),
    [byContract, st],
  );

  const counts = useMemo(
    () =>
      new Map(
        TABS.map((tab) => [
          tab,
          tab === 'All' ? byContract.length : byContract.filter((q) => q.status === tab).length,
        ]),
      ),
    [byContract],
  );

  const setFilter = (patch: Partial<typeof state.qlf>) =>
    actions.set((s) => ({ qlf: { ...s.qlf, ...patch } }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-[46rem] text-sm text-ink-3">
          One quotation per customer work order. Start a new one from its contract.
        </p>
        <Select
          value={cid || ALL_CONTRACTS}
          onValueChange={(v) => setFilter({ cid: v === ALL_CONTRACTS ? '' : v })}
        >
          <SelectTrigger aria-label="Filter by contract" className="w-full sm:w-72 md:w-80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CONTRACTS}>All contracts</SelectItem>
            {CONTRACTS.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.customer} · {c.ct}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={st} onValueChange={(v) => setFilter({ st: v })}>
        <TabsList
          aria-label="Filter by status"
          className="h-12 w-full justify-start sm:h-9 sm:w-fit"
        >
          {TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="gap-1.5">
              {tab}
              <span className="border border-ink bg-paper-2 px-1 text-2xs leading-none font-extrabold text-ink-3">
                {counts.get(tab)}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DataTable
        columns={COLUMNS}
        rows={rows}
        rowKey={(q) => q.id}
        onRow={(q) => actions.go('editor', { qid: q.id, cid: q.cid })}
        empty={
          <Empty className="border border-rule bg-paper-3">
            <EmptyHeader>
              <EmptyTitle>No quotations in this view</EmptyTitle>
            </EmptyHeader>
          </Empty>
        }
      />
    </div>
  );
}

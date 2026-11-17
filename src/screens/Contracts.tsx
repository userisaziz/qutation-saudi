import { useMemo } from 'react';
import { ChevronRightIcon, SearchIcon } from 'lucide-react';
import { DataTable, type Column } from '@/components/app/DataTable';
import { EmptyHint } from '@/components/app/EmptyHint';
import { Input } from '@/components/ui/input';
import { CONTRACT_TONE } from '@/config/tones';
import { CONTRACTS } from '@/domain/catalog';
import { scheduleOf } from '@/data/schedule';
import { usePortal } from '@/state/portal';
import type { Contract } from '@/domain/types';
import { cn } from '@/lib/utils';

/**
 * The list a quotation starts from. A work order can only be priced against
 * one of these master contracts, and only while its term is live, so the term
 * and the number of rate lines behind it are the two figures that matter.
 */
function TermBar({ contract }: { contract: Contract }) {
  return (
    <span className="flex flex-col gap-1">
      <span className="text-xs text-ink-3">{contract.termText}</span>
      <span className="block h-1 w-full bg-paper-2" role="presentation">
        <span
          className={cn(
            'block h-full',
            contract.status === 'Expired'
              ? 'bg-rule'
              : contract.status === 'Expiring'
                ? 'bg-amber'
                : 'bg-olive',
          )}
          style={{ width: contract.pct }}
        />
      </span>
      <span className="text-2xs text-ink-3">{contract.pct} of term used</span>
    </span>
  );
}

export default function Contracts() {
  const { state, actions } = usePortal();

  const rows = useMemo(() => {
    const q = state.cSearch.trim().toLowerCase();
    if (!q) return CONTRACTS;
    return CONTRACTS.filter((c) =>
      `${c.customer}${c.ct}${c.arc}${c.legal}`.toLowerCase().includes(q),
    );
  }, [state.cSearch]);

  // One pass over the contracts for the two figures columns, so a keystroke in
  // the search box does not rebuild every schedule on the table.
  const figures = useMemo(() => {
    const out = new Map<string, { rates: number; drafts: number }>();
    CONTRACTS.forEach((c) =>
      out.set(c.id, {
        rates: scheduleOf(state.adds, c.id).length,
        drafts: state.quotes.filter((x) => x.cid === c.id && x.status === 'Draft').length,
      }),
    );
    return out;
  }, [state.adds, state.quotes]);

  const columns = useMemo<Column<Contract>[]>(
    () => [
      {
        key: 'customer',
        header: 'Customer',
        width: 'w-[24%]',
        mobile: 'primary',
        cell: (c) => (
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{c.customer}</span>
            <span className="truncate text-2xs text-ink-3">{c.legal}</span>
          </span>
        ),
      },
      {
        key: 'ct',
        header: 'Contract',
        width: 'w-[13%]',
        mobile: 'meta',
        cell: (c) => <span className="break-words">{c.ct}</span>,
      },
      {
        key: 'arc',
        header: 'ARC no.',
        width: 'w-[11%]',
        mobile: 'meta',
        cell: (c) => <span className="text-ink-3">{c.arc}</span>,
      },
      {
        key: 'term',
        header: 'Term',
        width: 'w-[20%]',
        mobile: 'meta',
        cell: (c) => <TermBar contract={c} />,
      },
      {
        key: 'rates',
        header: 'Rate lines',
        width: 'w-[10%]',
        mobile: 'figure',
        cell: (c) => figures.get(c.id)?.rates ?? 0,
      },
      {
        key: 'drafts',
        header: 'Drafts',
        width: 'w-[8%]',
        mobile: 'figure',
        cell: (c) => figures.get(c.id)?.drafts ?? 0,
      },
      {
        key: 'status',
        header: 'Status',
        width: 'w-[10%]',
        mobile: 'hide',
        cell: (c) => (
          <span
            className={cn(
              'inline-block rounded-full border px-2.5 py-1 text-2xs font-medium',
              CONTRACT_TONE[c.status],
            )}
          >
            {c.status}
          </span>
        ),
      },
      {
        key: 'open',
        header: '',
        width: 'w-[4%]',
        mobile: 'hide',
        cell: () => <ChevronRightIcon className="ml-auto text-ink-4" aria-hidden="true" />,
      },
    ],
    [figures],
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-prose text-sm text-ink-3">
        Master customer contracts. A work order can only be quoted against a contract within its
        term.
      </p>

      <div className="flex items-center gap-2">
        <label className="relative flex w-full max-w-80 items-center">
          <SearchIcon
            className="pointer-events-none absolute left-2.5 size-4 text-ink-3"
            aria-hidden="true"
          />
          <Input
            value={state.cSearch}
            onChange={(e) => actions.set({ cSearch: e.target.value })}
            placeholder="Search customer, CT or ARC no."
            aria-label="Search contracts"
            className="pl-9"
          />
        </label>
        <span className="text-xs text-ink-3">
          {rows.length} of {CONTRACTS.length}
        </span>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(c) => c.id}
        onRow={(c) => actions.go('contract', { cid: c.id, ctab: 'rates', page: 0 })}
        empty={
          <EmptyHint
            title="No contract matches that search"
            body="Search covers the customer, the trading name, the contract number and the ARC number."
          />
        }
      />
    </div>
  );
}

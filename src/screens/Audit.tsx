import { useMemo } from 'react';
import { DataTable, type Column } from '@/components/app/DataTable';
import { EmptyHint } from '@/components/app/EmptyHint';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePortal } from '@/state/portal';
import type { AuditEntry } from '@/domain/types';

/**
 * What the tool recorded, in the words it recorded it in: one row per action,
 * with the moment, the actor and their role, the area the action touched and
 * the contract or quotation it touched. Nothing here is editable — an entry is
 * written by the action that caused it.
 */

/** Radix refuses an empty item value, so "all areas" needs its own sentinel. */
const ALL_AREAS = '__all-areas__';

const COLUMNS: Column<AuditEntry>[] = [
  {
    key: 'at',
    header: 'When',
    width: 'w-36',
    mobile: 'meta',
    cell: (a) => <span className="text-ink-3 tabular-nums">{a.at}</span>,
  },
  {
    key: 'who',
    header: 'Who',
    width: 'w-40 whitespace-normal break-words',
    mobile: 'primary',
    cell: (a) => (
      <span className="flex min-w-0 flex-col">
        <span className="font-medium">{a.who}</span>
        <span className="text-2xs text-ink-3">{a.role}</span>
      </span>
    ),
  },
  {
    key: 'area',
    header: 'Area',
    width: 'w-28 whitespace-normal break-words',
    mobile: 'meta',
    cell: (a) => <span className="text-ink-3">{a.area}</span>,
  },
  {
    key: 'action',
    header: 'Action',
    width: 'whitespace-normal text-pretty break-words',
    mobile: 'figure',
    cell: (a) => <span className="font-medium">{a.action}</span>,
  },
  {
    key: 'obj',
    header: 'Object',
    width: 'w-36 whitespace-normal break-words',
    mobile: 'meta',
    cell: (a) => <span className="text-ink-3">{a.obj}</span>,
  },
];

export default function Audit() {
  const { state, actions } = usePortal();

  const areas = useMemo(
    () => Array.from(new Set(state.audit.map((a) => a.area))).sort(),
    [state.audit],
  );

  const rows = useMemo(() => {
    const q = state.af.q.trim().toLowerCase();
    return state.audit.filter(
      (a) =>
        (!state.af.area || a.area === state.af.area) &&
        (!q || `${a.who}${a.action}${a.obj}`.toLowerCase().includes(q)),
    );
  }, [state.audit, state.af.area, state.af.q]);

  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-prose text-sm text-ink-3">
        Who changed what, and when. Every rate write records its actor and reason.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex w-full flex-col gap-1 sm:w-56">
          <span className="text-2xs text-ink-3">Area</span>
          <Select
            value={state.af.area || ALL_AREAS}
            onValueChange={(value) =>
              actions.set({ af: { ...state.af, area: value === ALL_AREAS ? '' : value } })
            }
          >
            <SelectTrigger aria-label="Filter by area" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_AREAS}>All areas</SelectItem>
              {areas.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="flex w-full flex-col gap-1 sm:w-56" htmlFor="audit-search">
          <span className="text-2xs text-ink-3">Search</span>
          <Input
            id="audit-search"
            value={state.af.q}
            onChange={(e) => actions.set({ af: { ...state.af, q: e.target.value } })}
            placeholder="Search actor, action or object"
            aria-label="Search audit"
            className="w-full"
          />
        </label>

        <span className="text-xs text-ink-3" aria-live="polite">
          {rows.length} of {state.audit.length} entries
        </span>
      </div>

      <DataTable
        columns={COLUMNS}
        rows={rows}
        rowKey={(a) => `${a.at}-${a.action}`}
        caption="Newest first. Each entry is written by the action that caused it and cannot be edited here."
        empty={
          <EmptyHint
            title="No entry matches those filters"
            body="The search covers the actor, the action text and the contract or quotation number. Clear the area filter or widen the search."
          />
        }
      />
    </div>
  );
}

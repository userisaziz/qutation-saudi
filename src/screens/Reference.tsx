import { useMemo } from 'react';
import { DataTable, type Column } from '@/components/app/DataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CATEGORY_CODE, CATEGORY_LIST, DN, RATINGS, SIZES, VALVE_MODELS } from '@/domain/catalog';
import { usePortal } from '@/state/portal';
import type { Rtab } from '@/state/portal';
import { cn } from '@/lib/utils';

/**
 * The vocabulary a rate schedule is written in: which valve categories exist
 * and the models under each, how an inlet × outlet size maps to a DN, which
 * pressure classes sit in a rating band, and the one unit of measure services
 * are priced in. Read-only — services belong to a contract, not to this list.
 */

interface RefRow {
  a: string;
  b: string;
}

const TABS: [Rtab, string][] = [
  ['cats', 'Categories & models'],
  ['sizes', 'Sizes'],
  ['ratings', 'Flange ratings'],
  ['uom', 'UOM'],
];

export default function Reference() {
  const { state, actions } = usePortal();

  const sheet = useMemo(() => {
    switch (state.rtab) {
      case 'sizes':
        return {
          head1: 'Inlet × outlet',
          head2: 'DN (inlet)',
          mono: true,
          rows: SIZES.map((s, i) => ({ a: s, b: DN[i] })),
        };
      case 'ratings':
        return {
          head1: 'Rating group',
          head2: 'Pressure classes',
          mono: true,
          rows: RATINGS.map((x, i) => ({
            a: `${i ? 'H' : 'L'} · ${x}`,
            b: i ? '900, 1500, 2500' : '150, 300, 600',
          })),
        };
      case 'uom':
        return {
          head1: 'UOM',
          head2: 'Meaning',
          mono: false,
          rows: [{ a: 'EA', b: 'Each — default for all valve services' }],
        };
      default:
        return {
          head1: 'Category',
          head2: 'Models',
          mono: false,
          rows: CATEGORY_LIST.map((c) => ({
            a: `${CATEGORY_CODE[c]} · ${c}`,
            b: VALVE_MODELS[c].join(', '),
          })),
        };
    }
  }, [state.rtab]);

  const columns = useMemo<Column<RefRow>[]>(
    () => [
      {
        key: 'head',
        header: sheet.head1,
        width: 'w-48 whitespace-normal break-words',
        mobile: 'primary',
        cell: (r) => <span className="font-medium">{r.a}</span>,
      },
      {
        key: 'value',
        header: sheet.head2,
        width: 'whitespace-normal break-words',
        mobile: 'figure',
        cell: (r) => (
          <span className={cn('font-medium text-ink-3', sheet.mono && 'tabular-nums')}>{r.b}</span>
        ),
      },
    ],
    [sheet.head1, sheet.head2, sheet.mono],
  );

  const table = <DataTable columns={columns} rows={sheet.rows} rowKey={(r) => r.a} />;

  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-prose text-sm text-ink-3">
        Shared vocabulary for every contract&rsquo;s rate schedule. Services are defined per
        contract.
      </p>

      <Tabs
        value={state.rtab}
        onValueChange={(value) => {
          const next = TABS.find(([id]) => id === value)?.[0];
          if (next) actions.set({ rtab: next });
        }}
        className="flex flex-col gap-3"
      >
        <TabsList
          variant="line"
          className="flex h-auto w-full flex-wrap justify-start gap-0 rounded-none border border-rule bg-paper-3 p-0 text-ink-3 group-data-horizontal/tabs:h-auto"
        >
          {TABS.map(([id, label]) => (
            <TabsTrigger
              key={id}
              value={id}
              className="h-11 rounded-none border-0 border-b border-b-transparent px-3 text-sm font-medium text-ink-3 after:hidden data-[state=active]:border-b-ink data-[state=active]:bg-transparent data-[state=active]:text-ink"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map(([id]) => (
          <TabsContent key={id} value={id} className="mt-0">
            {table}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

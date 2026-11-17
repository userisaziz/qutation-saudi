import { Fragment, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Toaster } from '@/components/ui/sonner';
import { Icon } from '@/components/app/Icon';
import { NAV_TILES, SCREEN_GROUP, SCREEN_TITLE } from '@/config/navigation';
import { CONTRACT_BY_ID } from '@/domain/catalog';
import { groupGaps } from '@/domain/pricing';
import { USERS } from '@/data/seed';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { toast } from 'sonner';
import { usePortal } from '@/state/portal';
import type { Screen } from '@/domain/types';
import { MenuIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The chrome: a cream rail on the left, a status line on top, one account.
 * Below 60rem the rail folds into a sheet and the topbar gains the handle.
 */
export function Shell({ children }: { children: ReactNode }) {
  const { state, role, isAdmin, quote, actions } = usePortal();
  const screen = (state.screen ?? 'contracts') as Screen;
  const compact = useIsCompact();
  const [navOpen, setNavOpen] = useState(false);

  const gapCount = useMemo(
    () => groupGaps(state.quotes.filter((q) => q.status === 'Draft')).length,
    [state.quotes],
  );

  const tiles = useMemo(() => NAV_TILES.filter((t) => !t.adminOnly || isAdmin), [isAdmin]);
  const user = { ...USERS[role], role };

  // The store owns the message, sonner owns the presentation. One bridge, so
  // the domain actions stay free of any UI import.
  useEffect(() => {
    if (state.toast) toast.message(state.toast.title, { description: state.toast.body });
  }, [state.toast]);

  const crumbs = useMemo(
    () => buildCrumbs(screen, CONTRACT_BY_ID[state.cid].customer, quote.no, actions),
    [screen, state.cid, quote.no, actions],
  );

  const account = (
    <DropdownMenu open={state.menu} onOpenChange={(open) => actions.set({ menu: open })}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-espresso text-2xs font-semibold text-paper">
            {user.ini}
          </span>
          <span className="flex min-w-0 flex-col items-start leading-tight">
            <b className="truncate text-sm font-semibold">{user.name}</b>
            <small className="text-2xs text-ink-3">{user.role}</small>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="font-normal text-ink-3">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={actions.switchRole}>
          Switch to {isAdmin ? 'Estimator' : 'Admin'} (demo)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const nav = (
    <nav aria-label="Portal" className="flex flex-col gap-px">
      {tiles.map((t) => {
        const on = SCREEN_GROUP[screen] === t.id;
        return (
          <Button
            key={t.id}
            variant="ghost"
            className={cn(
              'h-auto justify-start gap-2.5 rounded-full px-3 py-2.5 text-left',
              on ? 'bg-ink-2 text-paper hover:bg-ink-2' : 'text-ink-2 hover:bg-paper-2',
            )}
            aria-current={on ? 'page' : undefined}
            onClick={() => {
              actions.go(t.id);
              setNavOpen(false);
            }}
          >
            <Icon id={t.icon} size={20} />
            <span className="flex-1 truncate">{t.label}</span>
            {t.id === 'queue' && gapCount > 0 && (
              <span className="grid min-w-6 place-items-center rounded-full bg-amber px-1.5 text-2xs font-semibold text-ink">
                {gapCount}
              </span>
            )}
          </Button>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2.5 border-b border-rule px-2.5 py-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-espresso text-xs font-semibold text-paper">
        VS
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <b className="truncate text-sm font-semibold">ValvServe</b>
        <small className="truncate text-2xs text-ink-3">Contract quotations</small>
      </span>
    </div>
  );

  return (
    <>
      <div className="flex min-h-svh bg-paper text-ink">
        {!compact && (
          <aside
            data-print="chrome"
            className="sticky top-0 flex h-svh w-60 shrink-0 flex-col justify-between border-r border-rule bg-paper"
          >
            <div className="flex flex-col gap-3">
              {brand}
              <div className="px-2">{nav}</div>
            </div>
            <div className="border-t border-rule p-2">{account}</div>
          </aside>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            data-print="chrome"
            className="sticky top-0 z-20 flex flex-col gap-2 border-b border-rule bg-paper-3 px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              {compact && (
                <Sheet open={navOpen} onOpenChange={setNavOpen}>
                  <SheetTriggerRow onOpen={() => setNavOpen(true)} />
                  <SheetContent side="left" className="w-[min(20rem,85vw)] gap-0 p-0">
                    <SheetHeader className="p-0">
                      <SheetTitle className="sr-only">Portal navigation</SheetTitle>
                    </SheetHeader>
                    <div className="flex h-full flex-col justify-between overflow-y-auto pt-12">
                      <div className="flex flex-col gap-3">
                        {brand}
                        <div className="px-2">{nav}</div>
                      </div>
                      <div className="border-t border-rule p-2">{account}</div>
                    </div>
                  </SheetContent>
                </Sheet>
              )}
              <Breadcrumb className="min-w-0 flex-1">
                <BreadcrumbList className="flex-wrap gap-x-1.5 text-sm">
                  {crumbs.map((c, i) => (
                    <Fragment key={`${c.label}-${i}`}>
                      {i > 0 && <BreadcrumbSeparator />}
                      <BreadcrumbItem className="min-w-0">
                        {i === crumbs.length - 1 || !c.go ? (
                          <BreadcrumbPage className="truncate font-semibold">
                            {c.label}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink
                            asChild
                            className="cursor-pointer truncate text-ink-3 hover:text-ink"
                          >
                            <button type="button" onClick={c.go}>
                              {c.label}
                            </button>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <h1 className="text-xl">{SCREEN_TITLE[screen]}</h1>
          </header>

          <main className="min-w-0 flex-1 p-3 md:p-4">{children}</main>
        </div>
      </div>
      {/* light-only app: the toast must not follow an OS dark mode */}
      <Toaster theme="light" position="bottom-right" />
    </>
  );
}

function SheetTriggerRow({ onOpen }: { onOpen: () => void }) {
  return (
    <Button variant="outline" size="icon" aria-label="Open navigation" onClick={onOpen}>
      <MenuIcon />
    </Button>
  );
}

interface Crumb {
  label: string;
  go?: () => void;
}

function buildCrumbs(
  screen: Screen,
  customer: string,
  quoteNo: string,
  actions: ReturnType<typeof usePortal>['actions'],
): Crumb[] {
  if (screen === 'contracts') return [{ label: 'Contracts' }];
  if (screen === 'contract')
    return [{ label: 'Contracts', go: () => actions.go('contracts') }, { label: customer }];
  if (screen === 'import')
    return [
      { label: 'Contracts', go: () => actions.go('contracts') },
      { label: customer, go: () => actions.go('contract') },
      { label: 'Import rate sheet' },
    ];
  if (screen === 'editor')
    return [
      { label: 'Quotations', go: () => actions.go('quotes') },
      { label: customer, go: () => actions.go('contract', { ctab: 'quotes' }) },
      { label: quoteNo },
    ];
  if (screen === 'preview')
    return [
      { label: 'Quotations', go: () => actions.go('quotes') },
      { label: quoteNo, go: () => actions.go('editor') },
      { label: 'Proposal preview' },
    ];
  if (screen === 'quotes') return [{ label: 'Quotations' }];

  const adminLabels: Partial<Record<Screen, string>> = {
    queue: 'Rate queue',
    ref: 'Reference data',
    audit: 'Audit log',
  };
  return [{ label: 'Admin' }, { label: adminLabels[screen] ?? 'Admin' }];
}

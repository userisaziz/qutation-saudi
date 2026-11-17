import { Suspense, lazy } from 'react';
import type { ComponentType } from 'react';
import { Sprite } from '@/components/app/Icon';
import { Shell } from '@/components/app/Shell';
import { Skeleton } from '@/components/ui/skeleton';
import { ADMIN_ONLY_SCREENS } from '@/config/navigation';
import { PortalProvider, usePortal } from '@/state/portal';
import type { Screen } from '@/domain/types';
import Contracts from '@/screens/Contracts';
import ContractDetail from '@/screens/ContractDetail';
import Quotes from '@/screens/Quotes';
import Editor from '@/screens/Editor';

/**
 * Screen map.
 *
 * The four screens a quotation always touches (contracts, contract, quotes,
 * the composer) are static imports — they are the first or the next click and
 * stay in the main chunk. Preview and the Admin-only screens are lazy: the
 * proposal replica pulls in the document styles, and an Estimator never
 * requests the audit log at all.
 */
const Preview = lazy(() => import('@/screens/Preview'));
const RateQueue = lazy(() => import('@/screens/RateQueue'));
const Reference = lazy(() => import('@/screens/Reference'));
const Audit = lazy(() => import('@/screens/Audit'));
const Import = lazy(() => import('@/screens/Import'));

const SCREENS: Record<Screen, ComponentType> = {
  contracts: Contracts,
  contract: ContractDetail,
  quotes: Quotes,
  editor: Editor,
  preview: Preview,
  queue: RateQueue,
  ref: Reference,
  audit: Audit,
  import: Import,
};

function ScreenFallback() {
  return (
    <div className="flex flex-col gap-2" role="status" aria-label="Loading screen">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function Route() {
  const { state, isAdmin } = usePortal();
  const screen = state.screen;

  if (!screen) return null;

  // An Estimator who somehow lands on an Admin screen is shown Contracts
  // rather than a dead end; the rail never offered the link in the first place.
  const allowed: Screen =
    isAdmin || !ADMIN_ONLY_SCREENS.includes(screen) ? screen : 'contracts';
  const Screen = SCREENS[allowed];

  return (
    <Shell>
      <Suspense fallback={<ScreenFallback />}>
        <Screen />
      </Suspense>
    </Shell>
  );
}

export default function App() {
  return (
    <PortalProvider>
      <Sprite />
      <Route />
    </PortalProvider>
  );
}

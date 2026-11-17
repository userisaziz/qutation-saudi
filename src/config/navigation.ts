import type { Screen } from '@/domain/types';

/**
 * The rail. Five destinations, three of them Admin-only; a screen belongs to
 * the tile that stays lit while you are inside it.
 */
export interface NavTile {
  id: Screen;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

export const NAV_TILES: NavTile[] = [
  { id: 'contracts', label: 'Contracts', icon: 'ic-contract' },
  { id: 'quotes', label: 'Quotations', icon: 'ic-proposal' },
  { id: 'queue', label: 'Rate queue', icon: 'ic-rate-queue', adminOnly: true },
  { id: 'ref', label: 'Reference', icon: 'ic-service-bundle', adminOnly: true },
  { id: 'audit', label: 'Audit log', icon: 'ic-audit', adminOnly: true },
];

/** Screens reachable only by an Admin. Everyone else falls back to Contracts. */
export const ADMIN_ONLY_SCREENS: Screen[] = ['queue', 'ref', 'audit', 'import'];

/** Which rail tile is lit for a screen. */
export const SCREEN_GROUP: Record<Screen, string> = {
  contracts: 'contracts',
  contract: 'contracts',
  import: 'contracts',
  quotes: 'quotes',
  editor: 'quotes',
  preview: 'quotes',
  queue: 'queue',
  ref: 'ref',
  audit: 'audit',
};

/** One heading per screen, shown in the topbar. */
export const SCREEN_TITLE: Record<Screen, string> = {
  contracts: 'Master contracts',
  contract: 'Contract',
  import: 'Import rate sheet',
  quotes: 'Quotations',
  editor: 'Quotation',
  preview: 'Proposal preview',
  queue: 'Rate queue',
  ref: 'Reference data',
  audit: 'Audit log',
};

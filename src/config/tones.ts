import type { GapTone } from '@/domain/pricing';
import type { ContractStatus, QuoteStatus } from '@/domain/types';

/**
 * Status colours, once. The journal keeps three signals only: espresso for
 * what is settled, gold as a pale fill under ink text for what is missing,
 * and the olive ramp for what is healthy or newly added. Action blue never
 * appears here — it is reserved for the primary CTA.
 */

export const CONTRACT_TONE: Record<ContractStatus, string> = {
  Active: 'border-olive bg-olive text-paper-3',
  Expiring: 'border-amber bg-amber text-ink',
  Expired: 'border-rule bg-paper-2 text-ink-3',
};

export const QUOTE_TONE: Record<QuoteStatus, string> = {
  Draft: 'border-rule bg-paper-3 text-ink',
  Finalised: 'border-rule bg-espresso text-paper',
  Closed: 'border-rule bg-paper-2 text-ink-3',
};

/** A rate that resolved off the contract schedule, and which version carried it. */
export const RATE_TONE: Record<'locked' | 'added' | 'missing', string> = {
  locked: 'border-rule bg-espresso text-paper',
  added: 'border-rule bg-sage-pale text-forest',
  missing: 'border-amber bg-amber text-ink',
};

export const DOT_TONE: Record<ContractStatus, string> = {
  Active: 'bg-olive',
  Expiring: 'bg-amber',
  Expired: 'bg-rule',
};

/** What still blocks a draft: settled, blocked (gold under ink, never gold text), or clear to issue. */
export const GAP_TONE: Record<GapTone, string> = {
  muted: 'text-ink-3',
  warn: 'bg-amber px-1 font-extrabold text-ink',
  live: 'text-forest font-medium',
};

import type { Identity } from '@/domain/types';
import { cn } from '@/lib/utils';

/** The five positions, in the order the contract schedule is keyed by. */
const IDENTITY_POSITIONS = [
  { key: 'cat', label: 'Category' },
  { key: 'model', label: 'Model' },
  { key: 'size', label: 'Size' },
  { key: 'rating', label: 'Rating' },
  { key: 'svc', label: 'Service' },
] as const satisfies ReadonlyArray<{ key: keyof Identity; label: string }>;

/**
 * The signature of the tool: one contract rate is addressed by five
 * positions, and a line is only priced when all five are chosen. This renders
 * that key as five cells sharing one soft frame — incomplete positions stay
 * visible, because an unset position is the information.
 */
export function IdentityKey({
  identity,
  tone = 'paper',
  className,
}: {
  identity: Partial<Identity>;
  tone?: 'paper' | 'ink';
  className?: string;
}) {
  const surface = tone === 'ink' ? 'bg-ink text-paper-3' : 'bg-paper-3 text-ink';

  return (
    <span
      className={cn('inline-flex flex-wrap overflow-hidden rounded-md border border-rule', surface, className)}
      aria-label={IDENTITY_POSITIONS.map(
        (p) => `${p.label}: ${identity[p.key]?.trim() || 'not set'}`,
      ).join(', ')}
    >
      {IDENTITY_POSITIONS.map((p, i) => {
        const value = identity[p.key]?.trim();
        return (
          <span
            key={p.key}
            className={cn(
              'flex min-w-0 flex-col px-2 py-1',
              i > 0 && (tone === 'ink' ? 'border-l border-l-paper-3' : 'border-l border-l-rule'),
            )}
          >
            <span
              className={cn(
                'text-2xs leading-none font-medium',
                tone === 'ink' ? 'text-paper-2' : 'text-ink-3',
              )}
            >
              {p.label}
            </span>
            <span
              className={cn(
                'mt-0.5 text-sm leading-tight font-extrabold',
                !value && (tone === 'ink' ? 'text-paper-2' : 'text-ink-4'),
              )}
            >
              {value || '—'}
            </span>
          </span>
        );
      })}
    </span>
  );
}

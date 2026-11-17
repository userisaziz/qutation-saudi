import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * The plate: a soft white card holding one instruction and the figure that
 * justifies it. On the espresso band figures turn gold-pale; the tool's one
 * action blue has no plate — it belongs to buttons alone.
 */
export function Plate({
  label,
  value,
  sub,
  tone = 'paper',
  emphasis = false,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'paper' | 'ink' | 'amber' | 'sage';
  /** Raises the figure to display size; use when the number is the section's reason. */
  emphasis?: boolean;
  className?: string;
}) {
  const surface = {
    paper: 'border-rule bg-paper-3 text-ink',
    ink: 'border-rule bg-espresso text-paper',
    amber: 'border-rule bg-amber text-ink',
    sage: 'border-rule bg-sage-pale text-forest',
  }[tone];

  return (
    <div className={cn('flex flex-col gap-1 rounded-md border px-3 py-2.5', surface, className)}>
      <span
        className={cn(
          'text-2xs leading-none font-medium',
          tone === 'ink' ? 'text-paper-2' : tone === 'sage' ? 'text-forest' : 'text-ink-3',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'leading-none font-extrabold tracking-tight',
          emphasis ? 'text-2xl' : 'text-xl',
          tone === 'ink' && 'text-amber',
        )}
      >
        {value}
      </span>
      {sub != null && (
        <span
          className={cn('text-2xs leading-tight', tone === 'ink' ? 'text-paper-2' : 'text-ink-3')}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

/** A row of plates that shares its frame, the way a clipping sits on a card. */
export function PlateRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid gap-px overflow-hidden rounded-lg border border-rule bg-rule', className)}>
      {children}
    </div>
  );
}

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * The honest blank: what is missing, and what would make it appear. Never a
 * decorative illustration, never a number invented to fill the gap.
 */
export function EmptyHint({
  title,
  body,
  action,
  tone = 'paper',
  className,
}: {
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  tone?: 'paper' | 'ink';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-2 rounded-lg border border-dashed p-5',
        tone === 'ink' ? 'border-paper-3/20 bg-espresso text-paper' : 'border-ink-3 bg-paper-3 text-ink',
        className,
      )}
    >
      <b className={cn('text-md font-semibold', tone === 'ink' && 'text-paper')}>{title}</b>
      {body && (
        <p className={cn('max-w-prose text-sm', tone === 'ink' ? 'text-paper-2' : 'text-ink-3')}>
          {body}
        </p>
      )}
      {action}
    </div>
  );
}

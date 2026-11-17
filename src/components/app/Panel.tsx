import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A card on the paper: 24px corners, a hairline edge, one soft shadow. Depth
 * stays understated — the surface worlds and hairlines separate sections, not
 * elevation. Use `tone="ink"` for the deep espresso band that carries figures
 * in gold.
 */
export function Panel({
  title,
  aside,
  children,
  tone = 'paper',
  className,
  bodyClass,
  id,
}: {
  title?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  tone?: 'paper' | 'raise' | 'ink';
  className?: string;
  bodyClass?: string;
  id?: string;
}) {
  const ink = tone === 'ink';
  return (
    <section
      id={id}
      className={cn(
        'overflow-hidden rounded-lg border border-rule shadow-card',
        ink ? 'bg-espresso text-paper' : tone === 'raise' ? 'bg-paper-3' : 'bg-paper',
        className,
      )}
    >
      {(title || aside) && (
        <header
          className={cn(
            'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3',
            ink ? 'border-b border-b-paper-3/20' : 'border-b border-b-rule',
          )}
        >
          <h2 className={cn('text-lg', ink ? 'text-paper' : 'text-ink')}>
            {title}
          </h2>
          {aside && (
            <span className={cn('text-xs', ink ? 'text-paper-2' : 'text-ink-3')}>{aside}</span>
          )}
        </header>
      )}
      <div className={cn('p-4', bodyClass)}>{children}</div>
    </section>
  );
}

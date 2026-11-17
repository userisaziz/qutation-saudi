import { fmt } from '@/domain/format';
import { cn } from '@/lib/utils';

/**
 * Money in this tool is always SAR and always VAT inclusive, so the currency
 * is stated once per figure and dimmed, never repeated per row. Null is the
 * domain's own `not contracted` value and renders as the em dash the
 * documents use.
 */
export function Money({
  value,
  className,
  currency = true,
  size = 'base',
}: {
  value: number | null | undefined;
  className?: string;
  currency?: boolean;
  size?: 'sm' | 'base' | 'lg';
}) {
  const scale = { sm: 'text-sm', base: 'text-base', lg: 'text-xl' }[size];
  if (value == null) {
    return (
      <span
        className={cn('font-extrabold text-ink-3', scale, className)}
        aria-label="Not contracted"
      >
        —
      </span>
    );
  }
  return (
    <span className={cn('whitespace-nowrap', scale, className)}>
      {currency && <span className="mr-1 text-2xs font-medium text-ink-3">SAR</span>}
      <span className="font-extrabold">{fmt(value)}</span>
    </span>
  );
}

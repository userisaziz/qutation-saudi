import { cn } from '@/lib/utils';

/**
 * A status, signed the way the journal signs everything: a small pill, one
 * line. Colour carries meaning and only three meanings are available —
 * espresso for settled, gold for what is missing, olive for what is healthy.
 */
export function StatusPill({
  tone,
  label,
  icon,
  className,
}: {
  /** Class string from `config/tones.ts`; never a literal colour here. */
  tone: string;
  label: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs leading-none font-medium break-words',
        tone,
        className,
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </span>
  );
}

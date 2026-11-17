import sprite from '@/assets/icons.svg?raw';
import { cn } from '@/lib/utils';

/**
 * The domain sprite. Valve types, rate states and document glyphs are drawn
 * for this tool, so they ship as one inline sprite rather than a generic icon
 * set. Chrome icons (menu, close, chevrons) come from lucide instead.
 */
export function Sprite() {
  return <div className="hidden" aria-hidden="true" dangerouslySetInnerHTML={{ __html: sprite }} />;
}

export function Icon({
  id,
  size = 16,
  className,
}: {
  id: string;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={cn('shrink-0', className)}
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <use href={`#${id}`} />
    </svg>
  );
}

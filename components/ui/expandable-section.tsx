'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpandableSectionProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function ExpandableSection({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  className,
  children,
}: ExpandableSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn('rounded-lg border border-border/60 overflow-hidden', className)}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors hover:bg-muted/30 cursor-pointer"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-foreground truncate">{title}</span>
          {subtitle && (
            <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
              {subtitle}
            </span>
          )}
          {badge && <span className="flex-shrink-0">{badge}</span>}
        </div>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-muted-foreground flex-shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="border-t border-border/60 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

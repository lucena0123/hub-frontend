'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, icon: Icon, badge, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4 border-b border-border pb-3', className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-accent text-accent-foreground">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {badge}
        {action}
      </div>
    </div>
  );
}

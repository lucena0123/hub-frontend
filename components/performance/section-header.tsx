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
    <div className={cn('premium-section-header', className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="premium-icon-chip">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div>
          <h3 className="premium-section-title">{title}</h3>
          {subtitle && <p className="premium-section-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {badge}
        {action}
      </div>
    </div>
  );
}

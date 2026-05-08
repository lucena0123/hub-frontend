import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Topbar } from '@/components/layout/topbar';
import { Breadcrumb, type BreadcrumbItem } from '@/components/layout/breadcrumb';

interface PageShellProps {
  eyebrow?: string;
  breadcrumb?: BreadcrumbItem[];
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function PageShell({
  eyebrow,
  breadcrumb,
  title,
  description,
  meta,
  actions,
  className,
  children,
}: PageShellProps) {
  const resolvedEyebrow = breadcrumb && breadcrumb.length > 0 ? undefined : eyebrow;

  return (
    <div className={cn('page-shell', className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <Breadcrumb items={breadcrumb} />
      )}
      <Topbar eyebrow={resolvedEyebrow} title={title} actions={actions} />
      {(description || meta) && (
        <div className="mb-6 space-y-2">
          {description && <p className="page-description">{description}</p>}
          {meta && <div className="page-meta">{meta}</div>}
        </div>
      )}
      <div className="space-y-8">{children}</div>
    </div>
  );
}

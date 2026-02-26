import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Breadcrumb, type BreadcrumbItem } from "@/components/layout/breadcrumb";

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
  return (
    <div className={cn("page-shell", className)}>
      <header className="page-header">
        <div className="space-y-3">
          {breadcrumb && breadcrumb.length > 0 && (
            <Breadcrumb items={breadcrumb} />
          )}
          {eyebrow && !breadcrumb && <p className="page-eyebrow">{eyebrow}</p>}
          <h1 className="page-title">{title}</h1>
          {description && <p className="page-description">{description}</p>}
        </div>
        {(meta || actions) && (
          <div className="page-meta">
            {meta}
            {actions}
          </div>
        )}
      </header>
      <div className="space-y-10">{children}</div>
    </div>
  );
}

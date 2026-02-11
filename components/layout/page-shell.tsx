import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageShellProps {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function PageShell({
  eyebrow,
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
          {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
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

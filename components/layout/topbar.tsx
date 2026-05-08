import type { ReactNode } from 'react';

interface TopbarProps {
  eyebrow?: string;
  title: string;
  actions?: ReactNode;
}

export function Topbar({ eyebrow, title, actions }: TopbarProps) {
  return (
    <div className="flex items-end justify-between mb-6 gap-4">
      <div className="space-y-1 min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[22px] font-extrabold leading-[1.1] text-foreground truncate">
          {title}
        </h1>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

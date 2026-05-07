import type { ReactNode } from 'react';

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right text-foreground/90">{value}</span>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/30 p-3 space-y-2">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">{title}</p>
      {children}
    </div>
  );
}

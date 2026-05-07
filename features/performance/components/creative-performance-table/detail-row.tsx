export const DetailRow = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex items-start justify-between gap-3 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right text-foreground/90">{value && value.length > 0 ? value : '—'}</span>
  </div>
);

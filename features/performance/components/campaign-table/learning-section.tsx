import { Badge } from '@/components/ui/badge';
import type { LearningSummary } from '@/types';
import { buildLearningRows, resolveLearningBadge } from './formatters';

interface CampaignLearningSectionProps {
  learningSummary?: LearningSummary | null;
}

export function CampaignLearningSection({ learningSummary }: CampaignLearningSectionProps) {
  const badge = resolveLearningBadge(learningSummary);
  const rows = buildLearningRows(learningSummary);

  return (
    <div className="rounded-md border border-border/60 bg-muted/10 p-3 text-[11px] text-muted-foreground">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Aprendizado (Meta)</p>
        <Badge variant="outline" className={`text-[10px] ${badge.tone}`}>
          {badge.label}
        </Badge>
      </div>
      {rows.length === 0 ? (
        <p className="mt-2 text-[10px] text-muted-foreground">
          Sem dados suficientes de aprendizado para este período.
        </p>
      ) : (
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-2">
              <span>{row.label}</span>
              <span className="text-foreground/80">{row.value}</span>
            </div>
          ))}
        </div>
      )}
      {learningSummary?.notes && (
        <p className="mt-2 text-[10px] text-muted-foreground">{learningSummary.notes}</p>
      )}
    </div>
  );
}

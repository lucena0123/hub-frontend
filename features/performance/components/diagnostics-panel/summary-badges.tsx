import { Badge } from '@/components/ui/badge';
import type { OptimizationCenterResponse } from '@/types';

interface SummaryBadgesProps {
  summary: OptimizationCenterResponse['summary'];
}

export function SummaryBadges({ summary }: SummaryBadgesProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {summary.critical > 0 && (
        <Badge className="bg-rose-500 text-white text-xs">
          {summary.critical} crítico{summary.critical > 1 ? 's' : ''}
        </Badge>
      )}
      {summary.warning > 0 && (
        <Badge className="bg-amber-400 text-amber-950 text-xs">
          {summary.warning} atenção
        </Badge>
      )}
      {summary.opportunity > 0 && (
        <Badge className="bg-emerald-500 text-white text-xs">
          {summary.opportunity} oportunidade{summary.opportunity > 1 ? 's' : ''}
        </Badge>
      )}
      {summary.info > 0 && (
        <Badge variant="secondary" className="text-xs">
          {summary.info} info
        </Badge>
      )}
    </div>
  );
}

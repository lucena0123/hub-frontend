import { Badge } from '@/components/ui/badge';
import { formatOptionalCurrency, formatPercent } from './formatters';

interface CampaignBudgetSectionProps {
  budgetBase: number;
  budgetBaseLabel: string;
  budgetPeriod: number;
  budgetRemaining: number;
  budgetStatus: string;
  budgetUsed: number;
  budgetUtilization: number;
  hasBudgetInfo: boolean;
  isDailyBudget: boolean;
}

export function CampaignBudgetSection({
  budgetBase,
  budgetBaseLabel,
  budgetPeriod,
  budgetRemaining,
  budgetStatus,
  budgetUsed,
  budgetUtilization,
  hasBudgetInfo,
  isDailyBudget,
}: CampaignBudgetSectionProps) {
  if (!hasBudgetInfo) {
    return (
      <div className="rounded-md border border-border/60 p-3 bg-muted/10 text-xs text-muted-foreground">
        Budget indisponível para este período.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border/60 p-3 bg-muted/20 text-xs">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Budget</p>
        <Badge
          variant="outline"
          className={`text-[10px] ${budgetStatus === 'Estourado'
            ? 'border-rose-500/40 text-rose-300'
            : budgetStatus === 'No limite'
              ? 'border-amber-400/40 text-amber-200'
              : 'border-emerald-500/30 text-emerald-300'
          }`}
        >
          {budgetStatus}
        </Badge>
      </div>
      {isDailyBudget ? (
        <>
          <p className="mt-1">{budgetBaseLabel} {formatOptionalCurrency(budgetBase)}</p>
          <p>Total período {formatOptionalCurrency(budgetPeriod)}</p>
        </>
      ) : (
        <p className="mt-1">Total {formatOptionalCurrency(budgetPeriod)}</p>
      )}
      <p>Usado {formatOptionalCurrency(budgetUsed)}</p>
      <p>Restante {formatOptionalCurrency(budgetRemaining)}</p>
      <p className="mt-1 text-muted-foreground">% uso {formatPercent(budgetUtilization || 0)}</p>
    </div>
  );
}

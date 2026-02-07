'use client';

import { useCallback, useEffect, useState } from 'react';
import { DollarSign, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api/client/http';

interface CampaignPacing {
  campaignId: string;
  campaignName: string;
  status: string;
  dailyBudget: number;
  spendToday: number;
  spendThisMonth: number;
  daysElapsed: number;
  daysInMonth: number;
  daysRemaining: number;
  expectedSpendToDate: number;
  pacingPercentage: number;
  pacingStatus: 'on_track' | 'under_pacing' | 'over_pacing';
  projectedMonthlySpend: number;
  remainingBudget: number;
}

interface BudgetPacingResponse {
  clientId: string;
  summary: {
    total: number;
    onTrack: number;
    underPacing: number;
    overPacing: number;
  };
  campaigns: CampaignPacing[];
}

const statusConfig = {
  on_track: { label: 'No ritmo', color: 'bg-emerald-500', badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: DollarSign },
  under_pacing: { label: 'Abaixo', color: 'bg-amber-500', badgeClass: 'border-amber-200 bg-amber-50 text-amber-900', icon: TrendingDown },
  over_pacing: { label: 'Acima', color: 'bg-rose-500', badgeClass: 'border-rose-200 bg-rose-50 text-rose-800', icon: TrendingUp },
} as const;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

interface BudgetPacingCardProps {
  clientId: string | null | undefined;
}

export function BudgetPacingCard({ clientId }: BudgetPacingCardProps) {
  const [data, setData] = useState<BudgetPacingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!clientId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<BudgetPacingResponse>(`/api/clients/${clientId}/budget-pacing`);
      setData(res.data);
    } catch {
      setError('Falha ao carregar budget pacing.');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!clientId) return null;

  return (
    <Card className="border-l-4 border-l-emerald-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Budget Pacing
          </span>
          <div className="flex items-center gap-2">
            {data && (
              <div className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 text-[10px]">
                  {data.summary.onTrack}
                </Badge>
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900 text-[10px]">
                  {data.summary.underPacing}
                </Badge>
                <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-800 text-[10px]">
                  {data.summary.overPacing}
                </Badge>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>Consumo de budget das campanhas ativas no mês corrente.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {loading && !data ? (
          <p className="text-sm text-muted-foreground">Carregando pacing...</p>
        ) : !data || data.campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma campanha ativa com budget configurado.</p>
        ) : (
          data.campaigns.map((campaign) => {
            const config = statusConfig[campaign.pacingStatus];
            const StatusIcon = config.icon;
            const progressWidth = Math.min(campaign.pacingPercentage, 200);

            return (
              <div key={campaign.campaignId} className="rounded-lg border p-3 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{campaign.campaignName}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className={`text-[10px] ${config.badgeClass}`}>
                        <StatusIcon className="h-3 w-3 mr-0.5" />
                        {config.label} ({campaign.pacingPercentage}%)
                      </Badge>
                      {campaign.dailyBudget > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          {formatCurrency(campaign.dailyBudget)}/dia
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                    <p>Dia {campaign.daysElapsed}/{campaign.daysInMonth}</p>
                    <p>{campaign.daysRemaining} restantes</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${config.color}`}
                      style={{ width: `${Math.min(progressWidth / 2, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Gasto: {formatCurrency(campaign.spendThisMonth)}</span>
                    <span>Esperado: {formatCurrency(campaign.expectedSpendToDate)}</span>
                  </div>
                </div>

                {/* Details row */}
                <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground">{formatCurrency(campaign.dailyBudget)}</p>
                    <p>Budget/dia</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{formatCurrency(campaign.projectedMonthlySpend)}</p>
                    <p>Projeção mensal</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{formatCurrency(campaign.remainingBudget)}</p>
                    <p>Restante</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

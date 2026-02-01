'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CampaignHealthCardProps {
  totalReach: number;
  avgFrequency: number;
  avgCpm: number;
  totalImpressions: number;
  totalSpend: number;
  qualityRanking?: string | null;
  engagementRateRanking?: string | null;
  conversionRateRanking?: string | null;
}

const rankingLabel: Record<string, string> = {
  ABOVE_AVERAGE: 'Acima da Média',
  AVERAGE: 'Na Média',
  BELOW_AVERAGE_10: 'Abaixo (Bottom 10%)',
  BELOW_AVERAGE_20: 'Abaixo (Bottom 20%)',
  BELOW_AVERAGE_35: 'Abaixo (Bottom 35%)',
  UNKNOWN: 'Insuficiente',
};

const rankingColor: Record<string, string> = {
  ABOVE_AVERAGE: 'bg-emerald-500',
  AVERAGE: 'bg-yellow-500',
  BELOW_AVERAGE_10: 'bg-rose-600',
  BELOW_AVERAGE_20: 'bg-rose-500',
  BELOW_AVERAGE_35: 'bg-orange-500',
  UNKNOWN: 'bg-slate-400',
};

function frequencyColor(freq: number): string {
  if (freq < 3) return 'text-emerald-600';
  if (freq < 5) return 'text-yellow-600';
  return 'text-rose-600';
}

function frequencyStatus(freq: number): string {
  if (freq < 3) return 'Saudável';
  if (freq < 5) return 'Atenção';
  return 'Saturado';
}

export function CampaignHealthCard({
  totalReach,
  avgFrequency,
  avgCpm,
  totalImpressions,
  totalSpend,
  qualityRanking,
  engagementRateRanking,
  conversionRateRanking,
}: CampaignHealthCardProps) {
  const hasRankings = qualityRanking || engagementRateRanking || conversionRateRanking;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Saúde da Campanha
          <Badge variant="outline">Health</Badge>
        </CardTitle>
        <CardDescription>
          Alcance, frequência, CPM e rankings de qualidade do Meta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Alcance</p>
            <p className="text-2xl font-bold">{totalReach.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground">
              pessoas únicas
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Frequência</p>
            <p className={`text-2xl font-bold ${frequencyColor(avgFrequency)}`}>
              {avgFrequency.toFixed(2)}x
            </p>
            <p className="text-xs text-muted-foreground">
              {frequencyStatus(avgFrequency)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">CPM</p>
            <p className="text-2xl font-bold">
              R$ {avgCpm.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">
              custo por mil impressões
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Impressões</p>
            <p className="text-2xl font-bold">{totalImpressions.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground">
              Invest: R$ {totalSpend.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </p>
          </div>

          {hasRankings && (
            <>
              <div className="border-t pt-4 md:col-span-4">
                <p className="text-sm font-semibold text-muted-foreground">
                  Rankings de Qualidade (Meta)
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Qualidade</p>
                <Badge className={rankingColor[qualityRanking || 'UNKNOWN'] || 'bg-slate-400'}>
                  {rankingLabel[qualityRanking || 'UNKNOWN'] || qualityRanking || '—'}
                </Badge>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Engajamento</p>
                <Badge className={rankingColor[engagementRateRanking || 'UNKNOWN'] || 'bg-slate-400'}>
                  {rankingLabel[engagementRateRanking || 'UNKNOWN'] || engagementRateRanking || '—'}
                </Badge>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Conversão</p>
                <Badge className={rankingColor[conversionRateRanking || 'UNKNOWN'] || 'bg-slate-400'}>
                  {rankingLabel[conversionRateRanking || 'UNKNOWN'] || conversionRateRanking || '—'}
                </Badge>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

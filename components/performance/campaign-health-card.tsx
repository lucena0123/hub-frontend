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

function frequencyBg(freq: number): string {
  if (freq < 3) return 'bg-emerald-500/5 border-emerald-500/10';
  if (freq < 5) return 'bg-yellow-500/5 border-yellow-500/10';
  return 'bg-rose-500/5 border-rose-500/10';
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
    <Card className="edge-card border-l-2 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          Saúde da Campanha
          <Badge variant="outline">Saúde</Badge>
        </CardTitle>
        <CardDescription>
          Alcance, frequência, CPM e rankings Meta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-[2px] bg-primary/10 border border-primary/30">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Alcance</p>
            <p className="text-lg font-bold mt-0.5">{totalReach.toLocaleString('pt-BR')}</p>
            <p className="text-[10px] text-muted-foreground">pessoas únicas</p>
          </div>

          <div className={`p-3 rounded-[2px] border ${frequencyBg(avgFrequency)}`}>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Frequência</p>
            <p className={`text-lg font-bold mt-0.5 ${frequencyColor(avgFrequency)}`}>
              {avgFrequency.toFixed(2)}x
            </p>
            <p className="text-[10px] text-muted-foreground">{frequencyStatus(avgFrequency)}</p>
          </div>

          <div className="p-3 rounded-[2px] bg-amber-500/10 border border-amber-500/30">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">CPM</p>
            <p className="text-lg font-bold mt-0.5">
              R$ {avgCpm.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="p-3 rounded-[2px] bg-secondary/60 border border-border/60">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Impressões</p>
            <p className="text-lg font-bold mt-0.5">{totalImpressions.toLocaleString('pt-BR')}</p>
            <p className="text-[10px] text-muted-foreground">
              Invest: R$ {totalSpend.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {hasRankings && (
          <div className="space-y-3 pt-2 border-t">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Rankings de Qualidade (Meta)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center space-y-1.5">
                <p className="text-xs text-muted-foreground">Qualidade</p>
                <Badge className={rankingColor[qualityRanking || 'UNKNOWN'] || 'bg-slate-400'}>
                  {rankingLabel[qualityRanking || 'UNKNOWN'] || qualityRanking || '—'}
                </Badge>
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-xs text-muted-foreground">Engajamento</p>
                <Badge className={rankingColor[engagementRateRanking || 'UNKNOWN'] || 'bg-slate-400'}>
                  {rankingLabel[engagementRateRanking || 'UNKNOWN'] || engagementRateRanking || '—'}
                </Badge>
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-xs text-muted-foreground">Conversão</p>
                <Badge className={rankingColor[conversionRateRanking || 'UNKNOWN'] || 'bg-slate-400'}>
                  {rankingLabel[conversionRateRanking || 'UNKNOWN'] || conversionRateRanking || '—'}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

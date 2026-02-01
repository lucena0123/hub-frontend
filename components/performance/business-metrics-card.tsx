'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BusinessMetricsData {
  totalSpend: number;
  totalConversations: number;
  totalContracts: number;
  totalRevenue: number;
  avgTicket: number;
  cac: number;
  costPerLead: number;
  conversionRate: number;
  ltv: number;
  ltvCacRatio: number;
  ltvCacHealth: string;
  roi: number;
  config: {
    lifetimeMonths: number;
    monthlyRevenue: number;
  };
}

interface BusinessMetricsCardProps {
  data: BusinessMetricsData | null;
  loading?: boolean;
}

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value) || value === 0) return '-';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
};

const healthColors: Record<string, string> = {
  excellent: 'bg-emerald-500',
  good: 'bg-blue-500',
  fair: 'bg-yellow-500',
  poor: 'bg-rose-500',
};

const healthLabels: Record<string, string> = {
  excellent: 'Excelente',
  good: 'Bom',
  fair: 'Regular',
  poor: 'Baixo',
};

function GaugeIndicator({ ratio, health }: { ratio: number; health: string }) {
  // Visual gauge: ratio of LTV:CAC
  const maxRatio = 8;
  const percentage = Math.min((ratio / maxRatio) * 100, 100);

  const bgColor = health === 'excellent' ? 'bg-emerald-500' :
    health === 'good' ? 'bg-blue-500' :
    health === 'fair' ? 'bg-yellow-500' : 'bg-rose-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">LTV:CAC Ratio</span>
        <span className="text-2xl font-bold">{ratio > 0 ? `${ratio.toFixed(1)}:1` : '-'}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all ${bgColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0</span>
        <span className="text-rose-500">2:1</span>
        <span className="text-yellow-500">3:1</span>
        <span className="text-emerald-500">5:1+</span>
      </div>
    </div>
  );
}

export function BusinessMetricsCard({ data, loading }: BusinessMetricsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Negócio</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Negócio</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground text-center py-8">
          Sem dados suficientes. Adicione dados do funil manual para visualizar CAC e LTV.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Métricas de Negócio
          <Badge className={healthColors[data.ltvCacHealth] ?? 'bg-slate-500'}>
            {healthLabels[data.ltvCacHealth] ?? data.ltvCacHealth}
          </Badge>
        </CardTitle>
        <CardDescription>
          Análise de CAC, LTV e retorno sobre investimento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left: Key Metrics */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">CAC</p>
                <p className="text-xl font-bold">{formatCurrency(data.cac)}</p>
                <p className="text-xs text-muted-foreground">Custo por aquisição</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">LTV</p>
                <p className="text-xl font-bold">{formatCurrency(data.ltv)}</p>
                <p className="text-xs text-muted-foreground">{data.config.lifetimeMonths} meses</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">CPL</p>
                <p className="text-xl font-bold">{formatCurrency(data.costPerLead)}</p>
                <p className="text-xs text-muted-foreground">Custo por lead</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">ROI</p>
                <p className={`text-xl font-bold ${data.roi > 0 ? 'text-emerald-600' : data.roi < 0 ? 'text-rose-600' : ''}`}>
                  {data.roi !== 0 ? `${data.roi.toFixed(0)}%` : '-'}
                </p>
                <p className="text-xs text-muted-foreground">Retorno</p>
              </div>
            </div>

            {/* Conversion funnel */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Conversas</span>
                <span className="font-medium">{data.totalConversations}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Contratos fechados</span>
                <span className="font-medium">{data.totalContracts}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa de conversão</span>
                <span className="font-medium">{data.conversionRate > 0 ? `${data.conversionRate.toFixed(1)}%` : '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ticket médio</span>
                <span className="font-medium">{formatCurrency(data.avgTicket)}</span>
              </div>
            </div>
          </div>

          {/* Right: LTV:CAC Gauge */}
          <div className="flex flex-col justify-center space-y-4">
            <GaugeIndicator ratio={data.ltvCacRatio} health={data.ltvCacHealth} />

            <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
              <p className="font-medium">
                {data.ltvCacRatio >= 3
                  ? 'O negócio está saudável.'
                  : data.ltvCacRatio >= 2
                    ? 'Margem apertada. Otimize o CAC ou aumente retenção.'
                    : data.ltvCacRatio > 0
                      ? 'CAC alto demais. O custo de aquisição está consumindo o LTV.'
                      : 'Adicione dados do funil para calcular o LTV:CAC.'}
              </p>
              {data.ltvCacRatio > 0 && data.ltvCacRatio < 3 && (
                <p className="text-muted-foreground">
                  Meta: LTV:CAC &gt; 3:1 para negócios de serviços
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

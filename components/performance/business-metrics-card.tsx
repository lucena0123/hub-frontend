'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

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
  const maxRatio = 8;
  const percentage = Math.min((ratio / maxRatio) * 100, 100);

  const bgColor = health === 'excellent' ? 'bg-emerald-500' :
    health === 'good' ? 'bg-blue-500' :
    health === 'fair' ? 'bg-yellow-500' : 'bg-rose-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">LTV:CAC</span>
        <span className="text-2xl font-bold">{ratio > 0 ? `${ratio.toFixed(1)}:1` : '-'}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${bgColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0</span>
        <span className="text-rose-500 font-medium">2:1</span>
        <span className="text-yellow-500 font-medium">3:1</span>
        <span className="text-emerald-500 font-medium">5:1+</span>
      </div>
    </div>
  );
}

export function BusinessMetricsCard({ data, loading }: BusinessMetricsCardProps) {
  if (loading) {
    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="text-base">Métricas de Negócio</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="text-base">Métricas de Negócio</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground text-center py-8">
          Adicione dados do funil para visualizar CAC e LTV.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          Métricas de Negócio
          <Badge className={healthColors[data.ltvCacHealth] ?? 'bg-slate-500'}>
            {healthLabels[data.ltvCacHealth] ?? data.ltvCacHealth}
          </Badge>
        </CardTitle>
        <CardDescription>CAC, LTV e retorno sobre investimento</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">CAC</p>
            <p className="text-lg font-bold mt-0.5">{formatCurrency(data.cac)}</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">LTV</p>
            <p className="text-lg font-bold mt-0.5">{formatCurrency(data.ltv)}</p>
            <p className="text-[10px] text-muted-foreground">{data.config.lifetimeMonths} meses</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">CPL</p>
            <p className="text-lg font-bold mt-0.5">{formatCurrency(data.costPerLead)}</p>
          </div>
          <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">ROI</p>
            <p className={`text-lg font-bold mt-0.5 ${data.roi > 0 ? 'text-emerald-600' : data.roi < 0 ? 'text-rose-600' : ''}`}>
              {data.roi !== 0 ? `${data.roi.toFixed(0)}%` : '-'}
            </p>
          </div>
        </div>

        {/* LTV:CAC Gauge */}
        <GaugeIndicator ratio={data.ltvCacRatio} health={data.ltvCacHealth} />

        {/* Conversion funnel */}
        <div className="space-y-1.5 pt-2 border-t">
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

        {/* Health insight */}
        <div className="p-3 rounded-lg bg-muted/50 text-xs space-y-0.5">
          <p className="font-medium">
            {data.ltvCacRatio >= 3
              ? 'Negócio saudável.'
              : data.ltvCacRatio >= 2
                ? 'Margem apertada. Otimize o CAC ou aumente retenção.'
                : data.ltvCacRatio > 0
                  ? 'CAC alto. Custo de aquisição está consumindo o LTV.'
                  : 'Adicione dados do funil para calcular o LTV:CAC.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { DollarSign, MessageCircle, TrendingUp, Radio, Reply, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface KpiOverviewStripProps {
  totalSpend: number;
  totalConversations: number;
  totalFirstReply: number;
  avgFrequency: number;
  roi: number | null;
  loading?: boolean;
}

const fmt = (value: number, style: 'currency' | 'decimal' | 'percent' = 'decimal') => {
  if (!Number.isFinite(value) || value === 0) return '—';
  if (style === 'currency')
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  if (style === 'percent') return `${Math.round(value)}%`;
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
};

const frequencyColor = (freq: number) => {
  if (freq < 3) return 'text-emerald-400';
  if (freq < 5) return 'text-amber-400';
  return 'text-rose-400';
};

const frequencyLabel = (freq: number) => {
  if (freq < 3) return 'Saudável';
  if (freq < 5) return 'Atenção';
  return 'Saturado';
};

export function KpiOverviewStrip({
  totalSpend,
  totalConversations,
  totalFirstReply,
  avgFrequency,
  roi,
  loading,
}: KpiOverviewStripProps) {
  const cpl = totalConversations > 0 ? totalSpend / totalConversations : 0;
  const replyRate = totalConversations > 0 ? (totalFirstReply / totalConversations) * 100 : 0;

  const kpis = [
    {
      label: 'Investimento',
      value: fmt(totalSpend, 'currency'),
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-primary/10 border border-primary/20',
    },
    {
      label: 'Conversas',
      value: totalConversations > 0 ? totalConversations.toLocaleString('pt-BR') : '—',
      icon: MessageCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border border-emerald-500/20',
    },
    {
      label: 'Custo/Lead',
      value: fmt(cpl, 'currency'),
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border border-amber-500/20',
    },
    {
      label: 'Frequência',
      value: avgFrequency > 0 ? `${avgFrequency.toFixed(1)}x` : '—',
      icon: Radio,
      color: frequencyColor(avgFrequency),
      bg: avgFrequency >= 5
        ? 'bg-rose-500/10 border border-rose-500/20'
        : avgFrequency >= 3
          ? 'bg-amber-500/10 border border-amber-500/20'
          : 'bg-emerald-500/10 border border-emerald-500/20',
      subtitle: avgFrequency > 0 ? frequencyLabel(avgFrequency) : undefined,
    },
    {
      label: 'Taxa de Resposta',
      value: fmt(replyRate, 'percent'),
      icon: Reply,
      color: 'text-primary',
      bg: 'bg-primary/10 border border-primary/20',
    },
    {
      label: 'ROI',
      value: roi != null && Number.isFinite(roi) && roi !== 0 ? `${roi.toFixed(0)}%` : '—',
      icon: BarChart3,
      color: roi != null && roi > 0 ? 'text-emerald-500' : 'text-destructive',
      bg: roi != null && roi > 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-destructive/10 border border-destructive/30',
    },
  ];

  if (loading) {
    return (
      <Card className="edge-card">
        <CardContent className="py-4">
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-[2px] bg-muted animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="edge-card">
      <CardContent className="py-4">
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className={`rounded-[2px] ${kpi.bg} p-3 space-y-1`}>
                <div className="flex items-center gap-1.5">
                  <Icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                  <span className="text-[11px] text-muted-foreground font-medium">{kpi.label}</span>
                </div>
                <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                {kpi.subtitle && <p className={`text-[10px] ${kpi.color}`}>{kpi.subtitle}</p>}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

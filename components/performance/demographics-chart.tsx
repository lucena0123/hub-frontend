'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';

interface BreakdownSegment {
  label: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  conversions: number;
  ctr: number;
  cpm: number;
  shareOfSpend: number;
}

interface DemographicsChartProps {
  ageGenderData: BreakdownSegment[];
  placementData: BreakdownSegment[];
  regionData: BreakdownSegment[];
  countryData: BreakdownSegment[];
  loading?: boolean;
}

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value) || value === 0) return '-';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
};

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString('pt-BR');
};

const COLORS = [
  '#f97316', '#10b981', '#f59e0b', '#ef4444', '#eab308',
  '#84cc16', '#f43f5e', '#fb7185', '#22c55e', '#a3e635',
];

function BreakdownBarChart({
  data,
  title,
  description,
  emptyMessage,
  metricKey = 'conversions',
  metricLabel = 'Conv.',
}: {
  data: BreakdownSegment[];
  title: string;
  description: string;
  emptyMessage?: string;
  metricKey?: keyof BreakdownSegment;
  metricLabel?: string;
}) {
  const chartData = useMemo(() => {
    return data.slice(0, 10).map(seg => ({
      name: seg.label.length > 20 ? seg.label.slice(0, 18) + '...' : seg.label,
      fullName: seg.label,
      spend: Number(seg.spend.toFixed(2)),
      metricValue: typeof seg[metricKey] === 'number' ? (seg[metricKey] as number) : 0,
      impressions: seg.impressions,
      ctr: Number(seg.ctr.toFixed(2)),
      share: Number(seg.shareOfSpend.toFixed(1)),
    }));
  }, [data, metricKey]);

  if (data.length === 0) {
    return (
      <Card className="edge-card border-l-2 border-l-primary">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground text-center py-8">
          {emptyMessage ?? 'Sem dados no período. Rode um sync full para preencher.'}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="edge-card border-l-2 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          {title}
          <Badge variant="outline">{data.length} segmentos</Badge>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis type="number" tickFormatter={(v) => `R$ ${v}`} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number | undefined, name: string | undefined) => {
              const safeValue = value ?? 0;
              if (name === 'spend') return [formatCurrency(safeValue), 'Investimento'];
              if (name === 'metricValue') return [formatNumber(safeValue), metricLabel];
              return [safeValue, name || ''];
            }}
          />
          <Legend formatter={(value) => value === 'spend' ? 'Investimento' : 'Conversões'} />
            <Bar dataKey="spend" fill="#f97316" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Top segments table */}
        <div className="mt-4 space-y-2">
          {data.slice(0, 5).map((seg, i) => (
            <div key={i} className="flex items-center justify-between text-sm border-b pb-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="font-medium">{seg.label}</span>
              </div>
              <div className="flex gap-4 text-muted-foreground">
                <span>{formatCurrency(seg.spend)}</span>
                <span>{typeof seg[metricKey] === 'number' ? (seg[metricKey] as number) : 0} {metricLabel.toLowerCase()}</span>
                <span>{seg.shareOfSpend.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const resolveMetricConfig = (
  data: BreakdownSegment[],
  preferredKey: keyof BreakdownSegment,
  preferredLabel: string,
  fallbackKey: keyof BreakdownSegment,
  fallbackLabel: string
) => {
  const preferredTotal = data.reduce((sum, seg) => sum + (typeof seg[preferredKey] === 'number' ? (seg[preferredKey] as number) : 0), 0);
  if (preferredTotal > 0) {
    return { key: preferredKey, label: preferredLabel, isFallback: false };
  }
  const fallbackTotal = data.reduce((sum, seg) => sum + (typeof seg[fallbackKey] === 'number' ? (seg[fallbackKey] as number) : 0), 0);
  if (fallbackTotal > 0) {
    return { key: fallbackKey, label: fallbackLabel, isFallback: true };
  }
  return { key: preferredKey, label: preferredLabel, isFallback: false };
};

export function DemographicsChart({ ageGenderData, placementData, regionData, countryData, loading }: DemographicsChartProps) {
  const regionMetric = useMemo(
    () => resolveMetricConfig(regionData, 'conversions', 'Conv.', 'clicks', 'Cliques'),
    [regionData]
  );
  const countryMetric = useMemo(
    () => resolveMetricConfig(countryData, 'conversions', 'Conv.', 'clicks', 'Cliques'),
    [countryData]
  );

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="edge-card border-l-2 border-l-primary">
          <CardHeader className="pb-3"><CardTitle className="text-base">Demografia</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="edge-card border-l-2 border-l-primary">
          <CardHeader className="pb-3"><CardTitle className="text-base">Posicionamentos</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="edge-card border-l-2 border-l-primary">
          <CardHeader className="pb-3"><CardTitle className="text-base">Estados</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="edge-card border-l-2 border-l-primary">
          <CardHeader className="pb-3"><CardTitle className="text-base">País</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <BreakdownBarChart
        data={ageGenderData}
        title="Demografia (Idade + Gênero)"
        description="Performance por faixa etária e gênero"
        emptyMessage="Sem dados demográficos no período. Rode um sync full para preencher."
      />
      <BreakdownBarChart
        data={placementData}
        title="Posicionamentos"
        description="Performance por plataforma e posição"
        emptyMessage="Sem dados de posicionamento no período. Rode um sync full para preencher."
      />
      <BreakdownBarChart
        data={regionData}
        title="Estados"
        description={regionMetric.isFallback ? 'Performance por estado (cliques)' : 'Performance por estado'}
        emptyMessage="Sem dados de localização (estado) no período. Rode um sync full para preencher."
        metricKey={regionMetric.key}
        metricLabel={regionMetric.label}
      />
      <BreakdownBarChart
        data={countryData}
        title="País"
        description={countryMetric.isFallback ? 'Performance por país (cliques)' : 'Performance por país'}
        emptyMessage="Sem dados de localização (país) no período. Rode um sync full para preencher."
        metricKey={countryMetric.key}
        metricLabel={countryMetric.label}
      />
    </div>
  );
}

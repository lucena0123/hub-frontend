'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
];

function BreakdownBarChart({ data, title, description }: { data: BreakdownSegment[]; title: string; description: string }) {
  const chartData = useMemo(() => {
    return data.slice(0, 10).map(seg => ({
      name: seg.label.length > 20 ? seg.label.slice(0, 18) + '...' : seg.label,
      fullName: seg.label,
      spend: Number(seg.spend.toFixed(2)),
      conversions: seg.conversions,
      impressions: seg.impressions,
      ctr: Number(seg.ctr.toFixed(2)),
      share: Number(seg.shareOfSpend.toFixed(1)),
    }));
  }, [data]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground text-center py-8">
          Nenhum dado disponível. Execute o sync com syncLevel &quot;full&quot;.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
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
                if (name === 'conversions') return [formatNumber(safeValue), 'Conversões'];
                return [safeValue, name || ''];
              }}
            />
            <Legend formatter={(value) => value === 'spend' ? 'Investimento' : 'Conversões'} />
            <Bar dataKey="spend" fill="#3b82f6" radius={[0, 4, 4, 0]}>
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
                <span>{seg.conversions} conv.</span>
                <span>{seg.shareOfSpend.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DemographicsChart({ ageGenderData, placementData, loading }: DemographicsChartProps) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Demografia</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center py-10">
            <p className="text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Posicionamentos</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center py-10">
            <p className="text-muted-foreground">Carregando...</p>
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
      />
      <BreakdownBarChart
        data={placementData}
        title="Posicionamentos"
        description="Performance por plataforma e posição"
      />
    </div>
  );
}

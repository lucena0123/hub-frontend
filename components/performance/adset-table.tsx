'use client';

import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AdSetMetric {
  adsetId: string;
  adsetName: string;
  totalImpressions: number;
  totalReach: number;
  totalClicks: number;
  totalLinkClicks: number;
  totalLandingPageViews: number;
  totalSpend: number;
  totalConversions: number;
  totalMessagingConversations: number;
  totalMessagingFirstReply: number;
  avgCtr: number;
  avgCpc: number;
  avgCpm: number;
  avgFrequency: number;
  cpl: number;
}

interface AdSetTableProps {
  adsets: AdSetMetric[];
  loading?: boolean;
}

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString('pt-BR');
};

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value) || value === 0) return '-';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
};

const formatOptionalNumber = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return value.toLocaleString('pt-BR');
};

const formatPercent = (value: number, decimals = 1) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `${value.toFixed(decimals)}%`;
};

export function AdSetTable({ adsets, loading }: AdSetTableProps) {
  if (loading) {
    return (
      <Card className="border-l-4 border-l-fuchsia-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Conjuntos de Anúncios</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-fuchsia-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          Conjuntos de Anúncios
          <Badge variant="outline">Conjuntos</Badge>
        </CardTitle>
        <CardDescription>
          Performance por publico/segmentacao
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conjunto</TableHead>
                <TableHead className="text-right">Alcance</TableHead>
                <TableHead className="text-right">Cliques</TableHead>
                <TableHead className="text-right">Link clicks</TableHead>
                <TableHead className="text-right">LP views</TableHead>
                <TableHead className="text-right">Conversas</TableHead>
                <TableHead className="text-right">Conversões</TableHead>
                <TableHead className="text-right">Conv %</TableHead>
                <TableHead className="text-right">CPL</TableHead>
                <TableHead className="text-right">CPC</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">CPA</TableHead>
                <TableHead className="text-right">CPM</TableHead>
                <TableHead className="text-right">Freq.</TableHead>
                <TableHead className="text-right">Investimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adsets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center text-muted-foreground">
                    Nenhum dado de ad set no período selecionado. Se a campanha não teve entrega, isso é esperado; caso contrário, execute o sync com syncLevel &quot;adset&quot; ou &quot;full&quot;.
                  </TableCell>
                </TableRow>
              ) : (
                adsets.map((adset) => {
                  const conversionRate =
                    adset.totalClicks > 0 ? (adset.totalConversions / adset.totalClicks) * 100 : 0;
                  const cpa = adset.totalConversions > 0 ? adset.totalSpend / adset.totalConversions : 0;

                  return (
                    <TableRow key={adset.adsetId}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {adset.adsetName || adset.adsetId}
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(adset.totalReach)}</TableCell>
                      <TableCell className="text-right">{formatNumber(adset.totalClicks)}</TableCell>
                      <TableCell className="text-right">{formatOptionalNumber(adset.totalLinkClicks)}</TableCell>
                      <TableCell className="text-right">{formatOptionalNumber(adset.totalLandingPageViews)}</TableCell>
                      <TableCell className="text-right">{formatNumber(adset.totalMessagingConversations)}</TableCell>
                      <TableCell className="text-right">{formatOptionalNumber(adset.totalConversions)}</TableCell>
                      <TableCell className="text-right">{formatPercent(conversionRate)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(adset.cpl)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(adset.avgCpc)}</TableCell>
                      <TableCell className="text-right">{formatPercent(adset.avgCtr, 2)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(cpa)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(adset.avgCpm)}</TableCell>
                      <TableCell className="text-right">
                        <span className={
                          adset.avgFrequency >= 5 ? 'text-rose-600 font-medium' :
                          adset.avgFrequency >= 3 ? 'text-yellow-600' : ''
                        }>
                          {adset.avgFrequency.toFixed(1)}x
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(adset.totalSpend)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

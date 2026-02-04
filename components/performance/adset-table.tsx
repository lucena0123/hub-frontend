'use client';

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

export function AdSetTable({ adsets, loading }: AdSetTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conjuntos de Anuncios</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Conjuntos de Anuncios
          <Badge variant="outline">Ad Sets</Badge>
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
                <TableHead className="text-right">Conversas</TableHead>
                <TableHead className="text-right">CPL</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">CPM</TableHead>
                <TableHead className="text-right">Freq.</TableHead>
                <TableHead className="text-right">Investimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adsets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Nenhum dado de ad set no período selecionado. Se a campanha não teve entrega, isso é esperado; caso contrário, execute o sync com syncLevel &quot;adset&quot; ou &quot;full&quot;.
                  </TableCell>
                </TableRow>
              ) : (
                adsets.map((adset) => (
                  <TableRow key={adset.adsetId}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {adset.adsetName || adset.adsetId}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(adset.totalReach)}</TableCell>
                    <TableCell className="text-right">{formatNumber(adset.totalMessagingConversations)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(adset.cpl)}</TableCell>
                    <TableCell className="text-right">{adset.avgCtr.toFixed(2)}%</TableCell>
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

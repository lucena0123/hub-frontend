import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PerformanceSummary } from '@/types';

interface CampaignTableProps {
  campaigns: PerformanceSummary[];
}

const statusColors: Record<string, string> = {
  excellent: 'bg-emerald-500',
  good: 'bg-blue-500',
  fair: 'bg-yellow-500',
  poor: 'bg-rose-500',
};

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString('pt-BR');
};

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
};

export function CampaignTable({ campaigns }: CampaignTableProps) {
  return (
    <Card className="border-l-4 border-l-sky-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          Performance por Campanha
          <Badge variant="outline">Campanhas</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead className="text-right">Alcance</TableHead>
                <TableHead className="text-right">Impressões</TableHead>
                <TableHead className="text-right">Cliques</TableHead>
                <TableHead className="text-right">Conversões</TableHead>
                <TableHead className="text-right">CPM</TableHead>
                <TableHead className="text-right">Freq.</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">
                    Nenhuma campanha encontrada
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign) => (
                  <TableRow key={campaign.campaignId}>
                    <TableCell className="font-medium max-w-[200px] truncate">{campaign.campaignName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {campaign.platform}
                      {campaign.budgetMode && campaign.budgetMode !== 'unknown' && (
                        <Badge
                          variant="outline"
                          className={`ml-2 text-[10px] px-1 py-0 h-5 ${campaign.budgetMode === 'abo'
                              ? 'border-purple-200 bg-purple-50 text-purple-700'
                              : campaign.budgetMode === 'cbo'
                                ? 'border-sky-200 bg-sky-50 text-sky-700'
                                : 'border-amber-200 bg-amber-50 text-amber-700'
                            }`}
                        >
                          {campaign.budgetMode.toUpperCase()}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(campaign.totalReach || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(campaign.totalImpressions)}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(campaign.totalClicks)}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(campaign.totalConversions)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(campaign.avgCpm || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={
                        (campaign.avgFrequency || 0) >= 5 ? 'text-rose-600 font-medium' :
                          (campaign.avgFrequency || 0) >= 3 ? 'text-yellow-600' : ''
                      }>
                        {(campaign.avgFrequency || 0).toFixed(1)}x
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{campaign.roas.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[campaign.status] ?? 'bg-slate-500'}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
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

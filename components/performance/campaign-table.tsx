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

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return `$${value.toLocaleString()}`;
};

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString();
};

export function CampaignTable({ campaigns }: CampaignTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">Conversions</TableHead>
                <TableHead className="text-right">CPL</TableHead>
                <TableHead className="text-right">CPA</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No campaigns found
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign) => (
                  <TableRow key={campaign.campaignId}>
                    <TableCell className="font-medium">{campaign.campaignName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {campaign.platform}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[campaign.status] ?? 'bg-slate-500'}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(campaign.totalSpend)}</TableCell>
                    <TableCell className="text-right">{formatNumber(campaign.totalConversions)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(campaign.avgCpl)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(campaign.avgCpa)}</TableCell>
                    <TableCell className="text-right">{campaign.roas.toFixed(2)}</TableCell>
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

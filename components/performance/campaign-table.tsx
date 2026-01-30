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
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">Conversions</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
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
                    <TableCell className="text-right">
                      {formatNumber(campaign.totalImpressions)}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(campaign.totalClicks)}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(campaign.totalConversions)}
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

'use client';

import type { ClientCampaign } from '../client-types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const ClientCampaignsTable = (props: { campaigns: ClientCampaign[] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Associated campaigns</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No campaigns found
                  </TableCell>
                </TableRow>
              ) : (
                props.campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{campaign.status ?? '-'}</TableCell>
                    <TableCell>{campaign.platform ?? '-'}</TableCell>
                    <TableCell>{campaign.budget ? `$${campaign.budget.toLocaleString()}` : '-'}</TableCell>
                    <TableCell>{campaign.spent ? `$${campaign.spent.toLocaleString()}` : '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};


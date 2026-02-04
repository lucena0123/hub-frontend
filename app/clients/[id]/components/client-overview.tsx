'use client';

import type { ClientDetails } from '../client-types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

export const ClientOverview = (props: { client: ClientDetails; campaignsCount: number; processesCount: number }) => {
  const client = props.client;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Contract</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Start</span>
            <span>{formatDate(client.contractStart)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">End</span>
            <span>{formatDate(client.contractEnd)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Budget</span>
            <span>${client.budget.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{client.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">CPF/CNPJ</span>
            <span>{client.cpfCnpj ?? '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Meta Ad Account ID</span>
            <span className="font-mono text-xs">{client.metaAdAccountId ?? '-'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Campaigns</span>
            <span>{client._count?.campaigns ?? props.campaignsCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Processes</span>
            <span>{client._count?.processes ?? props.processesCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Metrics</span>
            <span>{client._count?.metrics ?? '-'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


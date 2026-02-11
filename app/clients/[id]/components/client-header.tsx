'use client';

import Link from 'next/link';
import { ArrowLeft, BarChart3, Bell, Building2, FileText } from 'lucide-react';

import type { Client } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const tierColors: Record<string, string> = {
  basic: 'bg-muted-foreground',
  premium: 'bg-primary',
  enterprise: 'bg-amber-500',
  standard: 'bg-muted-foreground',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-500',
  inactive: 'bg-red-500',
  pending: 'bg-yellow-500',
  suspended: 'bg-orange-500',
  churned: 'bg-zinc-500',
};

export const ClientHeader = (props: { client: Client }) => {
  const client = props.client;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/clients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-7 w-7" />
            {client.name}
          </h1>
          <p className="text-muted-foreground">Client profile and activity overview</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <Badge className={tierColors[client.tier] || 'bg-gray-500'}>{client.tier}</Badge>
          <Badge className={statusColors[client.status] || 'bg-gray-500'}>{client.status}</Badge>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href={`/clients/${client.id}/performance`} className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/clients/${client.id}/reports`} className="gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/alerts" className="gap-2">
              <Bell className="h-4 w-4" />
              Alertas
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

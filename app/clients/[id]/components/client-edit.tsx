'use client';

import { UserCog } from 'lucide-react';

import type { ClientFormValues } from '@/components/client-form';
import { ClientForm } from '@/components/client-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { ClientDetails } from '../client-types';
import { toDateInput } from '../client-utils';

export const ClientEditForm = (props: {
  client: ClientDetails;
  saving: boolean;
  saveMessage: string | null;
  onSubmit: (values: ClientFormValues) => void;
}) => {
  const client = props.client;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-4 w-4" />
          Update client
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {props.saveMessage && <div className="rounded-md border px-4 py-3 text-sm text-muted-foreground">{props.saveMessage}</div>}
        <ClientForm
          onSubmit={props.onSubmit}
          submitting={props.saving}
          submitLabel="Save changes"
          defaultValues={{
            name: client.name,
            email: client.email,
            cpfCnpj: client.cpfCnpj ?? '',
            metaAdAccountId: client.metaAdAccountId ?? '',
            businessNicheKey: client.businessNicheKey ?? 'general',
            defaultChannelKey: client.defaultChannelKey ?? 'meta',
            tier: client.tier ?? 'basic',
            budget: client.budget,
            contractStart: toDateInput(client.contractStart),
            contractEnd: toDateInput(client.contractEnd),
          }}
        />
      </CardContent>
    </Card>
  );
};

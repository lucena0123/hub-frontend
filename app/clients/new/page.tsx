'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { ClientForm, type ClientFormValues } from '@/components/client-form';
import { createClient } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NewClientPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: ClientFormValues) => {
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        name: values.name,
        email: values.email,
        tier: values.tier,
        budget: values.budget,
        contractStart: values.contractStart,
        contractEnd: values.contractEnd ? values.contractEnd : null,
      };

      await createClient(payload);
      router.push('/clients');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar cliente');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon-sm">
              <Link href="/clients">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <UserPlus className="h-7 w-7" />
                Novo Cliente
              </h1>
              <p className="text-muted-foreground">Cadastre um novo cliente no sistema</p>
            </div>
          </div>
        </div>

        {error && (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-destructive">Erro ao salvar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Informacoes do cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientForm
              onSubmit={handleSubmit}
              submitting={submitting}
              submitLabel="Cadastrar cliente"
              onCancel={() => router.push('/clients')}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

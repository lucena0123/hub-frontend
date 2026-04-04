'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { ClientForm, type ClientFormValues } from '@/components/client-form';
import { createClient } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/layout/page-shell';
import { Reveal } from '@/components/layout/reveal';
import { SectionHeader } from '@/components/performance/section-header';

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
        businessNicheKey: values.businessNicheKey,
        defaultChannelKey: values.defaultChannelKey,
        tier: values.tier,
        budget: values.budget,
        metaAdAccountId: values.metaAdAccountId?.trim() ? values.metaAdAccountId.trim() : undefined,
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
    <PageShell
      eyebrow="Clientes / Novo"
      title="Onboarding de Cliente"
      description="Estruture o contrato, orçamento e integrações em uma única ficha."
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href="/clients" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
      }
    >
      <div className="space-y-8">
        <Reveal>
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
        </Reveal>

        <SectionHeader
          title="Ficha do Cliente"
          subtitle="Preencha dados contratuais e integrações."
          icon={UserPlus}
        />

        <Reveal delayMs={80}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Ficha do cliente</CardTitle>
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

            <div className="edge-card p-4 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Checklist</p>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Configurar base
                </h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Confirme o contrato e ciclo de faturamento.</li>
                <li>Inclua o orçamento com a moeda correta.</li>
                <li>Verifique o Meta Ad Account ID se houver mídia paga.</li>
              </ul>
              <div className="signal-chip w-fit">Tempo médio 6 min</div>
            </div>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}

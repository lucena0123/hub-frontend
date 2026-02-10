'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api/client/error';
import { listMetaAdAccounts, type MetaAdAccount } from '@/lib/api/client';

const tierOptions = [
  { value: 'basic', label: 'Basic', helper: 'Até R$ 5.000' },
  { value: 'standard', label: 'Standard', helper: 'R$ 5.000 - 10.000' },
  { value: 'premium', label: 'Premium', helper: 'R$ 10.000 - 15.000' },
  { value: 'enterprise', label: 'Enterprise', helper: 'Acima de R$ 15.000' },
] as const;

const normalizeCpfCnpj = (value: string) => value.replace(/\D/g, '');
const normalizeMetaAdAccountId = (value: string) => value.trim().replace(/^act_/i, '');

export const clientFormSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Informe o nome completo do cliente')
      .max(120, 'Nome muito longo'),
    email: z.string().email('Informe um e-mail valido'),
    cpfCnpj: z
      .string()
      .min(11, 'Informe CPF ou CNPJ')
      .refine((value) => {
        const digits = normalizeCpfCnpj(value);
        return digits.length === 11 || digits.length === 14;
      }, 'CPF/CNPJ invalido'),
    metaAdAccountId: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine((value) => {
        const normalized = normalizeMetaAdAccountId(value ?? '');
        if (!normalized) return true;
        return /^\d+$/.test(normalized);
      }, 'Meta Ad Account ID invalido'),
    tier: z.enum(['basic', 'standard', 'premium', 'enterprise']),
    budget: z.number().min(1, 'Informe um budget valido'),
    contractStart: z.string().min(1, 'Informe a data de inicio'),
    contractEnd: z.string().optional().or(z.literal('')),
  })
  .refine((data) => {
    if (!data.contractEnd) return true;
    return new Date(data.contractEnd).getTime() >= new Date(data.contractStart).getTime();
  }, {
    message: 'A data de termino deve ser posterior ao inicio',
    path: ['contractEnd'],
  });

export type ClientFormValues = z.infer<typeof clientFormSchema>;

const getTierPreview = (budget: number) => {
  if (!budget || Number.isNaN(budget)) return tierOptions[0];
  if (budget >= 15000) return tierOptions[3];
  if (budget >= 10000) return tierOptions[2];
  if (budget >= 5000) return tierOptions[1];
  return tierOptions[0];
};

interface ClientFormProps {
  defaultValues?: Partial<ClientFormValues>;
  onSubmit: (values: ClientFormValues) => Promise<void> | void;
  submitLabel?: string;
  submitting?: boolean;
  onCancel?: () => void;
  className?: string;
}

export function ClientForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Salvar cliente',
  submitting,
  onCancel,
  className,
}: ClientFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: '',
      email: '',
      cpfCnpj: '',
      metaAdAccountId: '',
      tier: 'basic',
      budget: 0,
      contractStart: '',
      contractEnd: '',
      ...defaultValues,
    },
  });

  const budgetValue = useWatch({ control, name: 'budget' });
  const selectedTier = useWatch({ control, name: 'tier' });
  const metaAdAccountValue = useWatch({ control, name: 'metaAdAccountId' });

  const tierPreview = getTierPreview(budgetValue ?? 0);
  const normalizedMetaValue = normalizeMetaAdAccountId(metaAdAccountValue ?? '');

  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [metaAccounts, setMetaAccounts] = useState<MetaAdAccount[]>([]);
  const [metaLoaded, setMetaLoaded] = useState(false);

  const handleLoadMetaAccounts = async () => {
    try {
      setMetaLoading(true);
      setMetaError(null);
      const data = await listMetaAdAccounts();
      setMetaAccounts(data.accounts ?? []);
      setMetaLoaded(true);
      if (!data.accounts || data.accounts.length === 0) {
        setMetaError('Nenhuma conta de anúncio encontrada para este token.');
      }
    } catch (err) {
      setMetaError(getApiErrorMessage(err, 'Falha ao carregar contas da Meta. Verifique o token no backend.'));
      setMetaAccounts([]);
      setMetaLoaded(true);
    } finally {
      setMetaLoading(false);
    }
  };

  const handleSelectMetaAccount = (value: string) => {
    setValue('metaAdAccountId', value, { shouldDirty: true, shouldValidate: true });
  };

  const selectedMetaAccount = metaAccounts.find((account) => {
    const rawAccountId = String(account.accountId ?? account.id ?? '');
    return normalizeMetaAdAccountId(rawAccountId) === normalizedMetaValue;
  });
  const selectedMetaAccountId = selectedMetaAccount
    ? normalizeMetaAdAccountId(String(selectedMetaAccount.accountId ?? selectedMetaAccount.id ?? ''))
    : '';

  return (
    <form
      className={cn('space-y-6', className)}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" placeholder="Cliente Exemplo" {...register('name')} />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="cliente@email.com" {...register('email')} />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
          <Input id="cpfCnpj" placeholder="000.000.000-00" {...register('cpfCnpj')} />
          {errors.cpfCnpj && (
            <p className="text-xs text-destructive">{errors.cpfCnpj.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="metaAdAccountId">Meta Ad Account ID</Label>
          <div className="flex flex-col gap-2">
            <Input
              id="metaAdAccountId"
              placeholder="3781226838794313"
              {...register('metaAdAccountId')}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadMetaAccounts}
                disabled={metaLoading}
              >
                {metaLoading ? 'Carregando BM...' : 'Buscar contas na BM'}
              </Button>
              {selectedMetaAccount && (
                <span className="text-xs text-muted-foreground">
                  Selecionado: {selectedMetaAccount.name ?? 'Conta'} (act_{selectedMetaAccountId})
                </span>
              )}
            </div>
          </div>
          {errors.metaAdAccountId && (
            <p className="text-xs text-destructive">{errors.metaAdAccountId.message}</p>
          )}
          {metaError && (
            <p className="text-xs text-destructive">{metaError}</p>
          )}
          {metaLoaded && metaAccounts.length > 0 && (
            <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
              <Label className="text-xs text-muted-foreground">Contas encontradas</Label>
              <Select
                value={normalizedMetaValue || undefined}
                onValueChange={handleSelectMetaAccount}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta de anúncio" />
                </SelectTrigger>
                <SelectContent>
                  {metaAccounts.map((account) => {
                    const accountId = normalizeMetaAdAccountId(String(account.accountId ?? account.id ?? ''));
                    return (
                      <SelectItem key={account.id ?? accountId} value={accountId}>
                        <div className="flex flex-col">
                          <span className="font-medium">{account.name ?? 'Conta sem nome'}</span>
                          <span className="text-xs text-muted-foreground">
                            act_{accountId}
                            {account.businessName ? ` • ${account.businessName}` : ''}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                A lista usa o token global do backend (<code className="text-xs">META_ACCESS_TOKEN</code>).
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget">Budget mensal (R$)</Label>
          <Input
            id="budget"
            type="number"
            min={0}
            step={0.01}
            {...register('budget', { valueAsNumber: true })}
          />
          {errors.budget && (
            <p className="text-xs text-destructive">{errors.budget.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Tier</Label>
          <Controller
            name="tier"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tier" />
                </SelectTrigger>
                <SelectContent>
                  {tierOptions.map((tier) => (
                    <SelectItem key={tier.value} value={tier.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{tier.label}</span>
                        <span className="text-xs text-muted-foreground">{tier.helper}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.tier && (
            <p className="text-xs text-destructive">{errors.tier.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contractStart">Inicio do contrato</Label>
          <Input id="contractStart" type="date" {...register('contractStart')} />
          {errors.contractStart && (
            <p className="text-xs text-destructive">{errors.contractStart.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contractEnd">Termino do contrato</Label>
          <Input id="contractEnd" type="date" {...register('contractEnd')} />
          {errors.contractEnd && (
            <p className="text-xs text-destructive">{errors.contractEnd.message}</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">Preview de tier:</span>
          <Badge className="capitalize" variant="secondary">
            {tierPreview.label}
          </Badge>
          {selectedTier !== tierPreview.value && (
            <span className="text-xs text-muted-foreground">
              Selecionado: {selectedTier}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Sugestao automatica baseada no budget informado.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={submitting || isSubmitting}>
          {submitting || isSubmitting ? 'Salvando...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LeadGenMetricsCardProps {
  totalMessagingConversations: number;
  totalMessagingFirstReply: number;
  totalLinkClicks: number;
  totalSpend: number;
  hasManualTracking?: boolean;
  qualifiedLeads?: number;
  disqualificationReasons?: Record<string, number> | null;
  contractsClosed?: number;
  totalRevenue?: number;
}

const DISQUALIFICATION_LABELS: Record<string, string> = {
  curioso: 'Curioso / sem intenção',
  fora_tema: 'Fora do tema',
  sem_perfil: 'Sem perfil (não se encaixa)',
  sem_verba: 'Sem verba',
  ja_tem_advogado: 'Já tem advogado / já resolveu',
  nao_respondeu: 'Não respondeu',
  outros: 'Outros',
};

export function LeadGenMetricsCard({
  totalMessagingConversations,
  totalMessagingFirstReply,
  totalLinkClicks,
  totalSpend,
  hasManualTracking = false,
  qualifiedLeads = 0,
  disqualificationReasons,
  contractsClosed = 0,
  totalRevenue = 0,
}: LeadGenMetricsCardProps) {
  const cpl = totalMessagingConversations > 0 ? totalSpend / totalMessagingConversations : 0;
  const responseRate =
    totalMessagingConversations > 0
      ? (totalMessagingFirstReply / totalMessagingConversations) * 100
      : 0;
  const qualificationRate =
    totalMessagingConversations > 0 ? (qualifiedLeads / totalMessagingConversations) * 100 : 0;
  const closingRate = qualifiedLeads > 0 ? (contractsClosed / qualifiedLeads) * 100 : 0;
  const clickToConversationRate = totalLinkClicks > 0 ? (totalMessagingConversations / totalLinkClicks) * 100 : 0;
  const costPerQualifiedLead = qualifiedLeads > 0 ? totalSpend / qualifiedLeads : 0;
  const costPerContract = contractsClosed > 0 ? totalSpend / contractsClosed : 0;
  const roi = totalSpend > 0 && totalRevenue > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

  const disqualificationEntries = Object.entries(disqualificationReasons ?? {})
    .filter(([, count]) => (Number.isFinite(count) ? count : 0) > 0)
    .sort((a, b) => b[1] - a[1]);
  const totalDisqualified = disqualificationEntries.reduce((acc, [, count]) => acc + count, 0);
  const topDisqualification = disqualificationEntries.slice(0, 4);

  const showManualSection =
    hasManualTracking ||
    qualifiedLeads > 0 ||
    contractsClosed > 0 ||
    totalRevenue > 0 ||
    topDisqualification.length > 0;

  return (
    <Card className="border-l-4 border-l-emerald-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          Performance de Leads
          <Badge variant="outline">Leads</Badge>
        </CardTitle>
        <CardDescription>
          Conversas e métricas de funil
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {/* Automatic Metrics (from Meta API) */}
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Conversas</p>
            <p className="text-lg font-bold mt-0.5">{totalMessagingConversations}</p>
            <p className="text-[10px] text-muted-foreground">
              CPL: R$ {cpl.toFixed(2)}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Com Resposta</p>
            <p className="text-lg font-bold mt-0.5">{totalMessagingFirstReply}</p>
            <p className="text-[10px] text-muted-foreground">
              {responseRate.toFixed(1)}% responderam
            </p>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Cliques</p>
            <p className="text-lg font-bold mt-0.5">{totalLinkClicks}</p>
            <p className="text-[10px] text-muted-foreground">
              {clickToConversationRate.toFixed(1)}% converteram
            </p>
          </div>

          <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Investimento</p>
            <p className="text-lg font-bold mt-0.5">R$ {totalSpend.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</p>
          </div>

          {/* Manual Tracking Metrics */}
          {showManualSection && (
            <>
              <div className="space-y-1 border-t pt-4 col-span-2">
                <p className="text-sm font-semibold text-muted-foreground">
                  Funil Manual (Input do Usuário)
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Leads Qualificados</p>
                <p className="text-2xl font-bold">{qualifiedLeads}</p>
                <p className="text-xs text-muted-foreground">
                  {qualificationRate.toFixed(1)}% das conversas
                </p>
                <p className="text-xs text-muted-foreground">
                  Custo: {qualifiedLeads > 0 ? `R$ ${costPerQualifiedLead.toFixed(2)}` : '—'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Contratos Fechados</p>
                <p className="text-2xl font-bold">{contractsClosed}</p>
                <p className="text-xs text-muted-foreground">
                  {closingRate.toFixed(1)}% dos qualificados
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Receita Gerada</p>
                <p className="text-2xl font-bold">
                  R$ {totalRevenue.toLocaleString('pt-BR', {maximumFractionDigits: 0})}
                </p>
                <p className="text-xs text-muted-foreground">
                  Ticket: R$ {contractsClosed > 0 ? (totalRevenue / contractsClosed).toLocaleString('pt-BR', {maximumFractionDigits: 0}) : 0}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">ROI Real</p>
                <p className="text-2xl font-bold text-green-600">
                  {roi > 0 ? `${roi.toFixed(0)}%` : '—'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Custo/Contrato: R$ {costPerContract.toFixed(0)}
                </p>
              </div>

              {topDisqualification.length > 0 && (
                <div className="space-y-2 col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-muted-foreground">Motivos de desqualificação</p>
                    <p className="text-xs text-muted-foreground">Total: {totalDisqualified}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {topDisqualification.map(([key, count]) => (
                      <Badge key={key} variant="secondary">
                        {(DISQUALIFICATION_LABELS[key] ?? key)}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

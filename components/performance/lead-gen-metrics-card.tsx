'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LeadGenMetricsCardProps {
  totalMessagingConversations: number;
  totalMessagingFirstReply: number;
  totalLinkClicks: number;
  totalSpend: number;
  qualifiedLeads?: number;
  contractsClosed?: number;
  totalRevenue?: number;
  roi?: number;
}

export function LeadGenMetricsCard({
  totalMessagingConversations,
  totalMessagingFirstReply,
  totalLinkClicks,
  totalSpend,
  qualifiedLeads = 0,
  contractsClosed = 0,
  totalRevenue = 0,
  roi = 0,
}: LeadGenMetricsCardProps) {
  const cpl = totalMessagingConversations > 0 ? totalSpend / totalMessagingConversations : 0;
  const responseRate =
    totalMessagingConversations > 0
      ? (totalMessagingFirstReply / totalMessagingConversations) * 100
      : 0;
  const qualificationRate =
    totalMessagingConversations > 0 && qualifiedLeads > 0
      ? (qualifiedLeads / totalMessagingConversations) * 100
      : 0;
  const closingRate = qualifiedLeads > 0 ? (contractsClosed / qualifiedLeads) * 100 : 0;
  const costPerContract = contractsClosed > 0 ? totalSpend / contractsClosed : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Lead Generation Performance
          <Badge variant="outline">Lead Gen</Badge>
        </CardTitle>
        <CardDescription>
          WhatsApp/Messenger conversations and funnel metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Automatic Metrics (from Meta API) */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Conversas Iniciadas</p>
            <p className="text-2xl font-bold">{totalMessagingConversations}</p>
            <p className="text-xs text-muted-foreground">
              CPL: R$ {cpl.toFixed(2)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Com Resposta</p>
            <p className="text-2xl font-bold">{totalMessagingFirstReply}</p>
            <p className="text-xs text-muted-foreground">
              {responseRate.toFixed(1)}% responderam
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Cliques</p>
            <p className="text-2xl font-bold">{totalLinkClicks}</p>
            <p className="text-xs text-muted-foreground">
              {totalMessagingConversations > 0
                ? ((totalMessagingConversations / totalLinkClicks) * 100).toFixed(1)
                : 0}% converteram
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Investimento</p>
            <p className="text-2xl font-bold">R$ {totalSpend.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</p>
          </div>

          {/* Manual Tracking Metrics */}
          {qualifiedLeads > 0 && (
            <>
              <div className="space-y-1 border-t pt-4 md:col-span-4">
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
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

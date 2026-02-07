'use client';

import type { LeadTrackingData } from '@/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const LeadTrackingHistory = (props: { records: LeadTrackingData[] }) => {
  return (
    <Card className="border-l-4 border-l-lime-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Histórico de Funil Manual</CardTitle>
        <CardDescription>Dados de qualificação e fechamento inseridos manualmente</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {props.records.map((record) => {
            const disqualificationEntries = Object.entries(record.disqualificationReasons ?? {})
              .filter(([, count]) => (Number.isFinite(count) ? count : 0) > 0)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3);

            const disqualificationText =
              disqualificationEntries.length > 0
                ? `Motivos: ${disqualificationEntries
                    .map(([key, count]) => `${key.replaceAll('_', ' ')} (${count})`)
                    .join(', ')}`
                : null;

            return (
              <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-medium">{new Date(record.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Leads Qualificados</p>
                    <p className="font-medium">{record.qualifiedLeads}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contratos Fechados</p>
                    <p className="font-medium">{record.contractsClosed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Receita</p>
                    <p className="font-medium">R$ {record.revenueGenerated.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ROI</p>
                    <p className="font-medium text-green-600">{record.roi ? `${record.roi.toFixed(0)}%` : '—'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 max-w-xs">
                  {record.notes && <p className="text-sm text-muted-foreground truncate w-full text-right">{record.notes}</p>}
                  {disqualificationText && <p className="text-xs text-muted-foreground truncate w-full text-right">{disqualificationText}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};


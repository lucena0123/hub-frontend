import type { CommercialLead } from '@/lib/api/client/commercial';

export function downloadCommercialLeadsCsv(leads: CommercialLead[]) {
  const headers = ['leadId', 'nomeEscritorio', 'origem', 'responsavel', 'statusAtual', 'dor01Ok', 'dor02Ok', 'dor03Ok', 'dataEntrada', 'updatedAt'];
  const rows = leads.map((lead) => [
    lead.leadId,
    lead.nomeEscritorio,
    lead.origem,
    lead.responsavel,
    lead.statusAtual,
    lead.dor01Ok,
    lead.dor02Ok,
    lead.dor03Ok,
    lead.dataEntrada,
    lead.updatedAt,
  ]);
  const escapeCsvValue = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const content = [headers, ...rows].map((cols) => cols.map(escapeCsvValue).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }));
  const anchor = Object.assign(document.createElement('a'), {
    href: url,
    download: `leads-${new Date().toISOString().slice(0, 10)}.csv`,
  });
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

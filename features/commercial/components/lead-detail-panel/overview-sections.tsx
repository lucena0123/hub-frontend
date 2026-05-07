import type { CommercialLead } from '@/lib/api/client/commercial';
import { cn } from '@/lib/utils';
import { COLUMNS } from '@/features/commercial/hooks/use-comercial';

import { InfoRow, Section } from './primitives';

export function LeadIdentitySection({ lead }: { lead: CommercialLead }) {
  return (
    <Section title="Identificação">
      <InfoRow label="Escritório" value={lead.nomeEscritorio} />
      <InfoRow label="Contato" value={lead.nomeContato} />
      <InfoRow label="Origem" value={lead.origem} />
      <InfoRow label="Responsável" value={lead.responsavel} />
      <InfoRow label="Status" value={COLUMNS.find((c) => c.key === lead.statusAtual)?.label} />
      <InfoRow
        label="DoR"
        value={
          <span className="font-mono text-[11px]">
            {['01', '02', '03'].map((n, i) => {
              const ok = [lead.dor01Ok, lead.dor02Ok, lead.dor03Ok][i];
              return (
                <span key={n} className={cn('mr-2', ok ? 'text-emerald-400' : 'text-muted-foreground/50')}>
                  {n} {ok ? '✓' : '○'}
                </span>
              );
            })}
          </span>
        }
      />
    </Section>
  );
}

export function LeadContactSection({ lead }: { lead: CommercialLead }) {
  if (!(lead.whatsapp || lead.email || lead.instagram || lead.cidade)) return null;

  return (
    <Section title="Contato">
      <InfoRow label="WhatsApp" value={lead.whatsapp} />
      <InfoRow label="E-mail" value={lead.email} />
      <InfoRow label="Instagram" value={lead.instagram} />
      <InfoRow label="Cidade" value={lead.cidade} />
    </Section>
  );
}

export function LeadQualificationSection({ lead }: { lead: CommercialLead }) {
  if (!(lead.areaPrincipal || lead.qtdAdvogados || lead.faturamentoEstimado || lead.orcamentoMarketing)) return null;

  return (
    <Section title="Qualificação">
      <InfoRow label="Área" value={lead.areaPrincipal?.replace('_', ' ')} />
      <InfoRow label="Advogados" value={lead.qtdAdvogados} />
      <InfoRow
        label="Faturamento"
        value={lead.faturamentoEstimado?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      />
      <InfoRow
        label="Budget mkt."
        value={lead.orcamentoMarketing?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      />
    </Section>
  );
}

export function LeadProposalSection({ lead }: { lead: CommercialLead }) {
  if (!(lead.valProposta || lead.urlProposta)) return null;

  return (
    <Section title="Proposta">
      {lead.valProposta && (
        <p className="text-sm font-semibold text-emerald-300">
          {lead.valProposta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
      )}
      {lead.urlProposta && (
        <a
          href={lead.urlProposta}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-sky-400 underline underline-offset-2"
        >
          Ver documento
        </a>
      )}
    </Section>
  );
}

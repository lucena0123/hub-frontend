'use client';

import { CommercialLead, ContractStatus, PaymentStatus } from '@/lib/api/client/commercial';
import { cn } from '@/lib/utils';
import { X, MessageCircle, Mail, Link2, Pencil, Trash2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { COLUMNS } from '../hooks/use-comercial';

interface LeadDetailPanelProps {
  lead: CommercialLead | null;
  saving: boolean;
  unifiedTimeline: Array<{ id: string; type: 'transition' | 'integration'; at: string; title: string; subtitle?: string }>;
  canManageSensitive: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (lead: CommercialLead) => void;
  onDispatch: (lead: CommercialLead, channel: 'whatsapp' | 'gmail') => void;
  onGenerateBriefingLink: (lead: CommercialLead) => void;
  onSubmitBriefing: (lead: CommercialLead) => void;
  onUpdatePrivacy: (lead: CommercialLead, update: { consentGiven: boolean }) => void;
  onUpdateProofs: (lead: CommercialLead, update: { contractStatus?: ContractStatus; paymentStatus?: PaymentStatus }) => void;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right text-foreground/90">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/30 p-3 space-y-2">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">{title}</p>
      {children}
    </div>
  );
}

export function LeadDetailPanel({
  lead,
  saving,
  unifiedTimeline,
  canManageSensitive,
  onClose,
  onEdit,
  onDelete,
  onDispatch,
  onGenerateBriefingLink,
  onSubmitBriefing,
  onUpdatePrivacy,
  onUpdateProofs,
}: LeadDetailPanelProps) {
  return (
    <aside
      className={cn(
        'fixed right-0 top-0 h-full z-30 flex flex-col bg-[#080808]/95 border-l border-border/40',
        '-webkit-backdrop-filter: blur(16px)',
        'backdrop-filter: blur(16px)',
        'transition-transform duration-200',
        lead ? 'translate-x-0 w-[360px] xl:w-[400px]' : 'translate-x-full w-[360px]',
      )}
      aria-label="Detalhes do lead"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 flex-shrink-0">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Detalhe do Lead</p>
        <div className="flex items-center gap-1">
          {lead && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs cursor-pointer"
                onClick={onEdit}
                title="Editar lead"
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Editar
              </Button>
              {canManageSensitive && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                  onClick={() => onDelete(lead)}
                  title="Excluir lead"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/6 cursor-pointer transition-colors"
            aria-label="Fechar painel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      {!lead ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm text-muted-foreground text-center">
            Selecione um lead no Kanban para ver os detalhes
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Identity */}
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

          {/* Contact */}
          {(lead.whatsapp || lead.email || lead.instagram || lead.cidade) && (
            <Section title="Contato">
              <InfoRow label="WhatsApp" value={lead.whatsapp} />
              <InfoRow label="E-mail" value={lead.email} />
              <InfoRow label="Instagram" value={lead.instagram} />
              <InfoRow label="Cidade" value={lead.cidade} />
            </Section>
          )}

          {/* Qualification */}
          {(lead.areaPrincipal || lead.qtdAdvogados || lead.faturamentoEstimado || lead.orcamentoMarketing) && (
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
          )}

          {/* Meeting */}
          {lead.dataDiagnostico && (
            <Section title="Diagnóstico Agendado">
              <p className="text-xs text-blue-300">
                {new Date(lead.dataDiagnostico).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}
              </p>
              {lead.calEventId && (
                <p className="text-[10px] text-muted-foreground font-mono">
                  ID: {lead.calEventId.slice(0, 20)}…
                </p>
              )}
            </Section>
          )}

          {/* Proposal */}
          {(lead.valProposta || lead.urlProposta) && (
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
          )}

          {/* Form status */}
          <Section title="Formulário">
            <InfoRow label="Token" value={lead.formToken || '—'} />
            <InfoRow label="Status" value={lead.formType ? `${lead.formType} enviado` : 'não enviado'} />
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] flex-1 cursor-pointer"
                onClick={() => onGenerateBriefingLink(lead)}
                disabled={saving}
              >
                <Link2 className="h-3 w-3 mr-1" />
                Gerar link
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] flex-1 cursor-pointer"
                onClick={() => onSubmitBriefing(lead)}
                disabled={saving}
              >
                Registrar briefing
              </Button>
            </div>
          </Section>

          {/* LGPD Consent */}
          <Section title="LGPD / Consentimento">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className={cn('h-4 w-4', lead.consentGiven ? 'text-emerald-400' : 'text-muted-foreground/40')} />
                <span className="text-xs text-foreground/80">
                  {lead.consentGiven
                    ? `Consentido ${lead.consentGivenAt ? `em ${new Date(lead.consentGivenAt).toLocaleDateString('pt-BR')}` : ''}`
                    : 'Aguardando consentimento'}
                </span>
              </div>
              {!lead.consentGiven && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
                  onClick={() => onUpdatePrivacy(lead, { consentGiven: true })}
                  disabled={saving}
                >
                  Marcar consentido
                </Button>
              )}
            </div>
          </Section>

          {/* Contract / Payment (only for negociacao+) */}
          {['negociacao', 'fechado'].includes(lead.statusAtual) && (
            <Section title="Contrato & Pagamento">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground shrink-0">Contrato</span>
                  <select
                    aria-label="Status do contrato"
                    className={cn(
                      'h-7 flex-1 rounded-lg border bg-transparent px-2 text-[11px] cursor-pointer',
                      lead.contractStatus === 'assinado' ? 'border-emerald-500/40 text-emerald-300' : 'border-input text-foreground/70',
                    )}
                    value={lead.contractStatus}
                    onChange={(e) => onUpdateProofs(lead, { contractStatus: e.target.value as ContractStatus })}
                    disabled={saving}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="assinado">Assinado</option>
                  </select>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground shrink-0">Pagamento</span>
                  <select
                    aria-label="Status do pagamento"
                    className={cn(
                      'h-7 flex-1 rounded-lg border bg-transparent px-2 text-[11px] cursor-pointer',
                      lead.paymentStatus === 'pago' ? 'border-emerald-500/40 text-emerald-300' : 'border-input text-foreground/70',
                    )}
                    value={lead.paymentStatus}
                    onChange={(e) => onUpdateProofs(lead, { paymentStatus: e.target.value as PaymentStatus })}
                    disabled={saving}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                  </select>
                </div>
                {(lead.contractStatus === 'assinado' && lead.paymentStatus === 'pago') && (
                  <p className="text-[10px] text-emerald-400 text-center pt-1">✓ Pronto para fechar</p>
                )}
              </div>
            </Section>
          )}

          {/* Quick dispatch */}
          <Section title="Dispatch Rápido">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs flex-1 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
                onClick={() => onDispatch(lead, 'whatsapp')}
                disabled={saving}
              >
                <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs flex-1 border-sky-500/40 text-sky-300 hover:bg-sky-500/10 cursor-pointer"
                onClick={() => onDispatch(lead, 'gmail')}
                disabled={saving}
              >
                <Mail className="h-3.5 w-3.5 mr-1.5" />
                Gmail
              </Button>
            </div>
          </Section>

          {/* Timeline */}
          {unifiedTimeline.length > 0 && (
            <Section title="Timeline">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {unifiedTimeline.map((event) => (
                  <div key={event.id} className="flex items-start gap-2">
                    <div className={cn(
                      'h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0',
                      event.type === 'transition' ? 'bg-primary' : 'bg-emerald-500',
                    )} />
                    <div className="min-w-0">
                      <p className="text-[11px] text-foreground/80 truncate">{event.title}</p>
                      {event.subtitle && <p className="text-[10px] text-muted-foreground truncate">{event.subtitle}</p>}
                      <p className="text-[10px] text-muted-foreground/50">
                        {new Date(event.at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </aside>
  );
}

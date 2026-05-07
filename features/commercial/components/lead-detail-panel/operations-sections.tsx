import { Mail, MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { CommercialLead, ContractStatus, PaymentStatus } from '@/lib/api/client/commercial';
import { cn } from '@/lib/utils';

import { Section } from './primitives';

type TimelineItem = {
  id: string;
  type: 'transition' | 'integration';
  at: string;
  title: string;
  subtitle?: string;
};

export function OnboardingSection({
  lead,
  saving,
  onUpdateOnboarding,
}: {
  lead: CommercialLead;
  saving: boolean;
  onUpdateOnboarding: (lead: CommercialLead, update: { d0Ok?: boolean; d1Ok?: boolean; d2Ok?: boolean; d3D4Ok?: boolean; d5D7Ok?: boolean }) => void;
}) {
  return (
    <Section title="Onboarding Operacional">
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <button
          type="button"
          className={cn('h-7 rounded border cursor-pointer', lead.onboardingD0Ok ? 'border-emerald-500/40 text-emerald-300' : 'border-input text-muted-foreground')}
          onClick={() => onUpdateOnboarding(lead, { d0Ok: !lead.onboardingD0Ok })}
          disabled={saving}
        >
          D0 {lead.onboardingD0Ok ? '✓' : '○'}
        </button>
        <button
          type="button"
          className={cn('h-7 rounded border cursor-pointer', lead.onboardingD1Ok ? 'border-emerald-500/40 text-emerald-300' : 'border-input text-muted-foreground')}
          onClick={() => onUpdateOnboarding(lead, { d1Ok: !lead.onboardingD1Ok })}
          disabled={saving}
        >
          D1 {lead.onboardingD1Ok ? '✓' : '○'}
        </button>
        <button
          type="button"
          className={cn('h-7 rounded border cursor-pointer', lead.onboardingD2Ok ? 'border-emerald-500/40 text-emerald-300' : 'border-input text-muted-foreground')}
          onClick={() => onUpdateOnboarding(lead, { d2Ok: !lead.onboardingD2Ok })}
          disabled={saving}
        >
          D2 {lead.onboardingD2Ok ? '✓' : '○'}
        </button>
        <button
          type="button"
          className={cn('h-7 rounded border cursor-pointer', lead.onboardingD3D4Ok ? 'border-emerald-500/40 text-emerald-300' : 'border-input text-muted-foreground')}
          onClick={() => onUpdateOnboarding(lead, { d3D4Ok: !lead.onboardingD3D4Ok })}
          disabled={saving}
        >
          D3-D4 {lead.onboardingD3D4Ok ? '✓' : '○'}
        </button>
        <button
          type="button"
          className={cn('h-7 rounded border cursor-pointer col-span-2', lead.onboardingD5D7Ok ? 'border-emerald-500/40 text-emerald-300' : 'border-input text-muted-foreground')}
          onClick={() => onUpdateOnboarding(lead, { d5D7Ok: !lead.onboardingD5D7Ok })}
          disabled={saving}
        >
          D5-D7 {lead.onboardingD5D7Ok ? '✓' : '○'}
        </button>
      </div>
    </Section>
  );
}

export function ContractPaymentSection({
  lead,
  saving,
  onUpdateProofs,
}: {
  lead: CommercialLead;
  saving: boolean;
  onUpdateProofs: (lead: CommercialLead, update: { contractStatus?: ContractStatus; paymentStatus?: PaymentStatus }) => void;
}) {
  if (!['negociacao', 'fechado'].includes(lead.statusAtual)) return null;

  return (
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
  );
}

export function QuickDispatchSection({
  lead,
  saving,
  onDispatch,
}: {
  lead: CommercialLead;
  saving: boolean;
  onDispatch: (lead: CommercialLead, channel: 'whatsapp' | 'gmail') => void;
}) {
  return (
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
  );
}

export function LeadTimelineSection({ unifiedTimeline }: { unifiedTimeline: TimelineItem[] }) {
  if (unifiedTimeline.length === 0) return null;

  return (
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
  );
}

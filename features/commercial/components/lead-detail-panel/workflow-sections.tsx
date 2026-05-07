import { Link2, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { CommercialLead } from '@/lib/api/client/commercial';
import { cn } from '@/lib/utils';

import { InfoRow, Section } from './primitives';

type TimelineItem = {
  id: string;
  type: 'transition' | 'integration';
  at: string;
  title: string;
  subtitle?: string;
};

export function SchedulingSection({
  lead,
  saving,
  latestSchedulingOutcome,
  onRunCalendarSync,
  onSendSchedulingInvite,
}: {
  lead: CommercialLead;
  saving: boolean;
  latestSchedulingOutcome?: TimelineItem;
  onRunCalendarSync: (leadId?: string) => void;
  onSendSchedulingInvite: (lead: CommercialLead) => void;
}) {
  return (
    <Section title="Agendamento de Diagnóstico">
      {latestSchedulingOutcome && (
        <p className="text-[11px] text-muted-foreground">
          {latestSchedulingOutcome.title}
        </p>
      )}
      {lead.dataDiagnostico ? (
        <>
          <p className="text-xs text-blue-300">
            {new Date(lead.dataDiagnostico).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}
          </p>
          {lead.calEventId && (
            <p className="text-[10px] text-muted-foreground font-mono">
              ID: {lead.calEventId.slice(0, 20)}…
            </p>
          )}
          <p className={cn('text-[10px]', lead.calMeetUrl ? 'text-emerald-400' : 'text-amber-300')}>
            {lead.calMeetUrl ? 'Meet detectado' : 'Meet ausente (bloqueia avanço)'}
          </p>
          {lead.calSyncedAt && (
            <p className="text-[10px] text-muted-foreground">
              Último sync: {new Date(lead.calSyncedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
          )}
        </>
      ) : (
        <p className="text-xs text-amber-300">
          Reunião ainda não confirmada no calendário.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[11px] cursor-pointer"
          onClick={() => onRunCalendarSync(lead.leadId)}
          disabled={saving}
        >
          Sincronizar
        </Button>
        {lead.calMeetUrl ? (
          <a
            href={lead.calMeetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-7 inline-flex items-center justify-center rounded-md border border-emerald-500/40 text-[11px] text-emerald-300 hover:bg-emerald-500/10"
          >
            Entrar no Meet
          </a>
        ) : (
          <span className="h-7 inline-flex items-center justify-center rounded-md border border-border/50 text-[11px] text-muted-foreground">
            Meet pendente
          </span>
        )}
        {lead.calEventUrl && (
          <a
            href={lead.calEventUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 h-7 inline-flex items-center justify-center rounded-md border border-sky-500/40 text-[11px] text-sky-300 hover:bg-sky-500/10"
          >
            Abrir evento no Google Calendar
          </a>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-[11px] w-full cursor-pointer"
        onClick={() => onSendSchedulingInvite(lead)}
        disabled={saving}
      >
        Enviar convite de agendamento
      </Button>
    </Section>
  );
}

export function LeadFormSection({
  lead,
  saving,
  onGenerateBriefingLink,
  onSubmitBriefing,
}: {
  lead: CommercialLead;
  saving: boolean;
  onGenerateBriefingLink: (lead: CommercialLead) => void;
  onSubmitBriefing: (lead: CommercialLead) => void;
}) {
  return (
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
  );
}

export function PrivacyConsentSection({
  lead,
  saving,
  onUpdatePrivacy,
}: {
  lead: CommercialLead;
  saving: boolean;
  onUpdatePrivacy: (lead: CommercialLead, update: { consentGiven: boolean }) => void;
}) {
  return (
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
  );
}

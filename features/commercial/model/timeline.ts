import type {
  CommercialIntegrationEvent,
  CommercialLead,
  CommercialLeadTimelineEvent,
} from '@/lib/api/client/commercial';
import type { UnifiedTimelineItem } from './types';

export const mapIntegrationEventLabel = (event: CommercialIntegrationEvent): { title: string; subtitle?: string } => {
  const eventType = event.eventType;
  if (eventType === 'scheduling:invite_sent') {
    const channels = Array.isArray(event.payload?.channels) ? event.payload.channels : [];
    const hasWhatsApp = channels.includes('whatsapp');
    const whatsappMode = event.payload?.whatsappMode;
    const interactive = whatsappMode === 'buttons_3' || event.payload?.interactiveMode === 'buttons_3';
    return {
      title: !hasWhatsApp
        ? 'Agendamento · Convite enviado'
        : interactive
          ? 'WhatsApp · Convite interativo enviado'
          : 'WhatsApp · Convite enviado (resposta por número)',
      subtitle: event.externalEventId ? `external: ${event.externalEventId}` : undefined,
    };
  }
  if (eventType === 'whatsapp:reply_confirmed') return { title: 'WhatsApp · Confirmado por resposta' };
  if (eventType === 'whatsapp:reply_open_calendar') return { title: 'WhatsApp · Calendário aberto' };
  if (eventType === 'whatsapp:reply_conflict') return { title: 'WhatsApp · Conflito de horário' };
  if (eventType === 'whatsapp:reply_invalid') return { title: 'WhatsApp · Opção inválida' };
  if (eventType === 'whatsapp:reply_received') return { title: 'WhatsApp · Resposta recebida' };
  if (eventType === 'whatsapp:reply_duplicate') return { title: 'WhatsApp · Resposta duplicada (ignorada)' };

  return {
    title: `${event.channel} · ${eventType}`,
    subtitle: event.externalEventId ? `external: ${event.externalEventId}` : undefined,
  };
};

export const buildUnifiedTimeline = (
  selectedLead: CommercialLead | null,
  timeline: CommercialLeadTimelineEvent[],
  integrationEvents: CommercialIntegrationEvent[],
): UnifiedTimelineItem[] => {
  if (!selectedLead) return [];
  const transitions = timeline.map((event) => ({
    id: `t-${event.id}`,
    type: 'transition' as const,
    at: event.createdAt,
    title: `${event.statusOrigem} → ${event.statusDestino}`,
    subtitle: event.observacao || event.actor || undefined,
  }));
  const integrations = integrationEvents.map((event) => {
    const mapped = mapIntegrationEventLabel(event);
    return {
      id: `i-${event.id}`,
      type: 'integration' as const,
      at: event.occurredAt,
      title: mapped.title,
      subtitle: mapped.subtitle,
    };
  });
  return [...transitions, ...integrations].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
};

type SchedulingInvite = {
  channelErrors?: Array<{ channel: 'whatsapp' | 'gmail'; message: string }>;
  channelsSent: Array<'whatsapp' | 'gmail'>;
  provider?: string;
  suggestedSlots: unknown[];
  whatsappMode?: string | null;
};

const channelLabel: Record<'whatsapp' | 'gmail', string> = {
  whatsapp: 'WhatsApp',
  gmail: 'email',
};

export function buildSchedulingInviteStatusMessage(invite: SchedulingInvite) {
  const sentChannels = invite.channelsSent.map((channel) => channelLabel[channel]).join(' + ');
  const failures = invite.channelErrors || [];
  const providerLabel = invite.provider === 'google_booking' ? 'Google Calendar' : 'calendário do Hub';
  const suggestionLabel = invite.suggestedSlots.length >= 2
    ? ` com ${invite.suggestedSlots.length} sugestões`
    : '';
  const hasWhatsAppDelivery = invite.channelsSent.includes('whatsapp');
  const interactiveLabel = !hasWhatsAppDelivery
    ? ''
    : invite.whatsappMode === 'buttons_3'
      ? ' (WhatsApp com 3 botões)'
      : ' (WhatsApp por resposta 1/2/3)';
  const baseMessage = `Convite de agendamento (${providerLabel}) enviado por ${sentChannels}${suggestionLabel}${interactiveLabel}.`;

  if (failures.length === 0) return baseMessage;

  const failuresText = failures
    .map((item) => `${channelLabel[item.channel]}: ${item.message}`)
    .join(' | ');
  return `${baseMessage} Falhas: ${failuresText}`;
}

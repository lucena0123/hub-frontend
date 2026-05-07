export const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
};

export const formatCpl = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value) || value <= 0) return '-';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
};

export const formatCta = (value: string | null | undefined) => {
  if (!value) return null;
  const map: Record<string, string> = {
    LEARN_MORE: 'Saiba mais',
    SEND_MESSAGE: 'Mensagem',
    WHATSAPP_MESSAGE: 'WhatsApp',
    CONTACT_US: 'Contato',
    APPLY_NOW: 'Aplicar',
    SIGN_UP: 'Cadastre-se',
    BOOK_TRAVEL: 'Agendar',
    GET_OFFER: 'Oferta',
    CALL_NOW: 'Ligar',
  };
  if (map[value]) return map[value];
  return value.replace(/_/g, ' ').toLowerCase();
};

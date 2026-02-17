import type { CreativeLibraryStatus } from '@/types';

export const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString('pt-BR');
};

export const formatCurrency = (value: number | null) => {
  if (value == null || !Number.isFinite(value) || value === 0) return '-';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
};

export const getDomainFromUrl = (value: string | null | undefined) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.hostname;
  } catch {
    return value;
  }
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

export const statusLabel: Record<CreativeLibraryStatus, string> = {
  winner: 'Vencedor',
  loser: 'Abaixo',
  fatigued: 'Fadiga',
  neutral: 'Neutro',
};

export const statusBadgeClass: Record<CreativeLibraryStatus, string> = {
  winner: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  fatigued: 'bg-amber-100 text-amber-900 border-amber-200',
  loser: 'bg-rose-100 text-rose-800 border-rose-200',
  neutral: 'bg-muted text-muted-foreground border-border',
};

export const pctClass = (value: number | null | undefined, invert?: boolean) => {
  if (value == null || !Number.isFinite(value)) return 'text-muted-foreground';
  const normalized = invert ? -value : value;
  if (normalized >= 20) return 'text-emerald-600 font-medium';
  if (normalized <= -20) return 'text-rose-600 font-medium';
  return 'text-muted-foreground';
};

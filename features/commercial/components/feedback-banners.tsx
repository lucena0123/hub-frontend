'use client';

import { AlertTriangle, CheckCircle, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { CommercialLead } from '@/lib/api/client/commercial';
import type { ComercialErrorAction } from '@/features/commercial/model';

export function StatusMessageBanner({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
      <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
      <p className="text-sm text-emerald-300 flex-1">{message}</p>
      <button type="button" onClick={onClose} aria-label="Fechar mensagem" className="text-muted-foreground hover:text-foreground cursor-pointer">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ErrorBanner({
  error,
  errorAction,
  actionLead,
  saving,
  onClose,
  onSendSchedulingInvite,
  onRunCalendarSync,
}: {
  error: string;
  errorAction: ComercialErrorAction;
  actionLead: CommercialLead | null;
  saving: boolean;
  onClose: () => void;
  onSendSchedulingInvite: (lead: CommercialLead) => void;
  onRunCalendarSync: (leadId?: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
      <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
      <p className="text-sm text-destructive flex-1">{error}</p>
      {errorAction?.type === 'send_scheduling_invite' && actionLead && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[11px] border-primary/50 text-primary hover:bg-primary/10 cursor-pointer"
          disabled={saving}
          onClick={() => onSendSchedulingInvite(actionLead)}
        >
          Enviar convite de agendamento
        </Button>
      )}
      {errorAction?.type === 'run_calendar_sync' && actionLead && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[11px] border-primary/50 text-primary hover:bg-primary/10 cursor-pointer"
          disabled={saving}
          onClick={() => onRunCalendarSync(actionLead.leadId)}
        >
          Sincronizar calendário
        </Button>
      )}
      {errorAction?.type === 'configure_calendar' && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[11px] border-primary/50 text-primary hover:bg-primary/10 cursor-pointer"
          onClick={() => { window.location.href = '/comercial/configuracoes'; }}
        >
          Configurar calendários
        </Button>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar erro"
        className="text-muted-foreground hover:text-foreground cursor-pointer"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

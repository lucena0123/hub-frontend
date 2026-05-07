'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LOSS_REASONS, NURTURE_REASONS, type PendingTransition } from '../../model';

interface SpecialTransitionDialogProps {
  pendingTransition: PendingTransition | null;
  saving: boolean;
  transitionReason: string;
  transitionDate: string;
  onOpenChange: (open: boolean) => void;
  onTransitionReasonChange: (value: string) => void;
  onTransitionDateChange: (value: string) => void;
  onConfirm: () => void;
}

export function SpecialTransitionDialog({
  pendingTransition,
  saving,
  transitionReason,
  transitionDate,
  onOpenChange,
  onTransitionReasonChange,
  onTransitionDateChange,
  onConfirm,
}: SpecialTransitionDialogProps) {
  return (
    <Dialog open={!!pendingTransition} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Mover para {pendingTransition?.to === 'nutricao' ? 'Nutrição' : 'Perdido'}
          </DialogTitle>
          <DialogDescription>
            {pendingTransition?.to === 'nutricao'
              ? 'Lead será mantido para acompanhamento futuro.'
              : 'Lead será arquivado como oportunidade perdida.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Motivo *</label>
            <select
              id="transition-reason"
              aria-label="Motivo da transição"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm cursor-pointer"
              value={transitionReason}
              onChange={(event) => onTransitionReasonChange(event.target.value)}
            >
              {(pendingTransition?.to === 'nutricao' ? NURTURE_REASONS : LOSS_REASONS).map((reason) => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>
          {pendingTransition?.to === 'nutricao' && (
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Data da próxima ação *</label>
              <input
                type="date"
                id="transition-date"
                aria-label="Data da próxima ação"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                value={transitionDate}
                onChange={(event) => onTransitionDateChange(event.target.value)}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={saving}>
            {saving ? 'Aguarde...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

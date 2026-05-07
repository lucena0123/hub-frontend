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
import { Input } from '@/components/ui/input';
import type { CommercialLead } from '@/lib/api/client/commercial';

interface DeleteLeadDialogProps {
  lead: CommercialLead | null;
  saving: boolean;
  deleteConfirmText: string;
  deleteReason: string;
  onOpenChange: (open: boolean) => void;
  onDeleteConfirmTextChange: (value: string) => void;
  onDeleteReasonChange: (value: string) => void;
  onConfirm: () => void;
}

export function DeleteLeadDialog({
  lead,
  saving,
  deleteConfirmText,
  deleteReason,
  onOpenChange,
  onDeleteConfirmTextChange,
  onDeleteReasonChange,
  onConfirm,
}: DeleteLeadDialogProps) {
  return (
    <Dialog open={!!lead} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            Excluir Lead Permanentemente
          </DialogTitle>
          <DialogDescription>
            Esta ação remove o lead <strong>{lead?.nomeEscritorio}</strong> e todos os eventos associados. Esta ação é irreversível.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Digite <strong>EXCLUIR</strong> para confirmar</label>
            <Input
              placeholder="EXCLUIR"
              value={deleteConfirmText}
              onChange={(event) => onDeleteConfirmTextChange(event.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Motivo (opcional)</label>
            <Input
              placeholder="Motivo da exclusão"
              value={deleteReason}
              onChange={(event) => onDeleteReasonChange(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={saving || deleteConfirmText.trim() !== 'EXCLUIR'}
          >
            {saving ? 'Excluindo...' : 'Excluir Permanentemente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

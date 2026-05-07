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
import type { CommercialLead } from '@/lib/api/client/commercial';
import { cn } from '@/lib/utils';

interface CompleteDiagnosisDialogProps {
  lead: CommercialLead | null;
  saving: boolean;
  observacaoDiag: string;
  onOpenChange: (open: boolean) => void;
  onObservacaoDiagChange: (value: string) => void;
  onConfirm: () => void;
}

export function CompleteDiagnosisDialog({
  lead,
  saving,
  observacaoDiag,
  onOpenChange,
  onObservacaoDiagChange,
  onConfirm,
}: CompleteDiagnosisDialogProps) {
  const trimmedLength = observacaoDiag.trim().length;

  return (
    <Dialog open={!!lead} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Concluir Diagnóstico</DialogTitle>
          <DialogDescription>
            Registre o resumo e evidências do diagnóstico com <strong>{lead?.nomeEscritorio}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">
              Resumo do diagnóstico * <span className="text-muted-foreground/60">(mín. 10 caracteres)</span>
            </label>
            <textarea
              className="w-full min-h-[120px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Ex: Lead demonstrou interesse em campanhas de tráfego pago. Escritório com 3 advogados, área trabalhista. Budget estimado R$ 3k/mês."
              value={observacaoDiag}
              onChange={(event) => onObservacaoDiagChange(event.target.value)}
            />
            <p className={cn(
              'text-[10px] text-right',
              trimmedLength >= 10 ? 'text-emerald-400' : 'text-muted-foreground/60',
            )}>
              {trimmedLength} caracteres {trimmedLength >= 10 ? '✓' : `(faltam ${10 - trimmedLength})`}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={saving || trimmedLength < 10}>
            {saving ? 'Aguarde...' : 'Confirmar conclusão'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

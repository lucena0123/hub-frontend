import { Badge } from '@/components/ui/badge';
import type { CreativeCoverage } from '@/app/clients/[id]/performance/use-client-performance-dashboard';
import type { MetaSyncDetails } from '@/lib/api/client';

interface CreativeCoverageStatusProps {
  creativeCoverage: CreativeCoverage | null | undefined;
  creativeCoverageDetails: MetaSyncDetails | null | undefined;
}

const getSyncErrorMessage = (details: MetaSyncDetails | null | undefined) => {
  if (!details) return null;
  if (details.errorMessage) return details.errorMessage;
  if (typeof details.metadata?.error === 'string') return details.metadata.error;
  return null;
};

export function CreativeCoverageStatus({ creativeCoverage, creativeCoverageDetails }: CreativeCoverageStatusProps) {
  if (!creativeCoverage) return null;

  const creativeCoverageClass =
    creativeCoverage.state === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : creativeCoverage.state === 'partial' || creativeCoverage.state === 'running'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : creativeCoverage.state === 'failed'
          ? 'border-rose-200 bg-rose-50 text-rose-800'
          : 'text-muted-foreground';

  const creativeSyncLevel = creativeCoverageDetails?.metadata?.syncLevel ? String(creativeCoverageDetails.metadata.syncLevel) : null;
  const creativeSyncRange = creativeCoverageDetails ? `${creativeCoverageDetails.dateRangeStart} → ${creativeCoverageDetails.dateRangeEnd}` : null;
  const creativeSyncTimestamp = creativeCoverageDetails
    ? new Date(creativeCoverageDetails.completedAt ?? creativeCoverageDetails.startedAt).toLocaleString('pt-BR')
    : null;

  const showCreativeCallout = creativeCoverage.state !== 'success' && creativeCoverage.state !== 'running';
  const creativeCalloutBaseClass =
    creativeCoverage.state === 'failed' ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50';
  const creativeCalloutTextClass = creativeCoverage.state === 'failed' ? 'text-rose-800' : 'text-amber-900';
  const creativeCalloutTextMutedClass = creativeCoverage.state === 'failed' ? 'text-rose-800/80' : 'text-amber-900/80';
  const creativeCalloutTextSubtleClass = creativeCoverage.state === 'failed' ? 'text-rose-800/70' : 'text-amber-900/70';

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={creativeCoverageClass}>
          {creativeCoverage.label}
        </Badge>
        {creativeSyncTimestamp && (
          <span className="text-xs text-muted-foreground">
            Último sync: {creativeSyncTimestamp}
            {creativeSyncLevel ? ` · nível ${creativeSyncLevel}` : ''}
          </span>
        )}
      </div>

      {showCreativeCallout ? (
        <div className={`rounded-lg border p-4 ${creativeCalloutBaseClass}`}>
          <div className="space-y-1">
            <p className={`text-sm font-medium ${creativeCalloutTextClass}`}>Criativos (Meta Ads)</p>
            {creativeCoverage.state === 'missing' ? (
              <p className={`text-sm ${creativeCalloutTextMutedClass}`}>
                Sem sync <span className="font-medium">ad/full</span> para capturar criativos e snapshots no período. Rode o{' '}
                <span className="font-medium">Sync Meta Ads (Full)</span> no topo.
              </p>
            ) : creativeCoverage.state === 'outdated' ? (
              <p className={`text-sm ${creativeCalloutTextMutedClass}`}>
                O último sync <span className="font-medium">ad/full</span> que encontramos cobre{' '}
                <span className="font-medium">{creativeSyncRange ?? '—'}</span>. Ajuste o período selecionado ou rode um novo sync full.
              </p>
            ) : creativeCoverage.state === 'insufficient' ? (
              <p className={`text-sm ${creativeCalloutTextMutedClass}`}>
                Há sync no período, mas o nível é <span className="font-medium">{creativeCoverage.syncLevel ?? creativeSyncLevel ?? '—'}</span>. Rode{' '}
                <span className="font-medium">ad/full</span> para capturar criativos e snapshots.
              </p>
            ) : creativeCoverage.state === 'partial' ? (
              <p className={`text-sm ${creativeCalloutTextMutedClass}`}>
                Sync parcial pode deixar insights incompletos. Rode um sync full e revise campanhas <span className="font-medium">unmapped</span>/erros.
              </p>
            ) : (
              <p className={`text-sm ${creativeCalloutTextMutedClass}`}>
                Falha no sync. {getSyncErrorMessage(creativeCoverageDetails) ? `Erro: ${getSyncErrorMessage(creativeCoverageDetails)}` : 'Verifique token e tente novamente.'}
              </p>
            )}
            {creativeSyncRange || creativeSyncLevel ? (
              <p className={`text-xs ${creativeCalloutTextSubtleClass}`}>
                {creativeSyncLevel ? `nível: ${creativeSyncLevel}` : null}
                {creativeSyncLevel && creativeSyncRange ? ' · ' : null}
                {creativeSyncRange ? `janela: ${creativeSyncRange}` : null}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

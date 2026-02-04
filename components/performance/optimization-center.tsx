'use client';

import { useMemo, useState } from 'react';

import type { CreativeCoverage } from '@/app/clients/[id]/performance/use-client-performance-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MetaSyncDetails } from '@/lib/api/client';
import type { OptimizationCenterResponse, OptimizationCenterThemeTargets } from '@/types';

import { CopyLab } from './optimization-center/copy-lab';
import { OptimizationHighlights } from './optimization-center/highlights';
import { categoryLabel, severityBadgeClass, severityLabel } from './optimization-center/labels';
import { PlaybookPanel } from './optimization-center/playbook-panel';

interface OptimizationCenterProps {
  data: OptimizationCenterResponse | null;
  loading?: boolean;
  creativeCoverage?: CreativeCoverage | null;
  creativeCoverageDetails?: MetaSyncDetails | null;
}

const EMPTY_ITEMS: OptimizationCenterResponse['items'] = [];

const themeTargetBadge = (label: string, value: string) => (
  <Badge variant="outline" className="text-xs">
    {label}: {value}
  </Badge>
);

const renderTargets = (targets: OptimizationCenterThemeTargets) => (
  <div className="flex flex-wrap gap-2">
    {themeTargetBadge('CPL bom ≤', `R$ ${targets.targetCplGoodMax}`)}
    {themeTargetBadge('CPL ok ≤', `R$ ${targets.targetCplOkMax}`)}
    {themeTargetBadge('CPL ruim ≥', `R$ ${targets.targetCplBadMin}`)}
    {themeTargetBadge('Qualificação ≥', `${targets.qualificationRateTargetMin}%`)}
    {themeTargetBadge('1ª resposta ≥', `${targets.firstReplyRateMin}%`)}
    {themeTargetBadge('Freq. alerta ≥', `${targets.frequencyWarning}x`)}
    {themeTargetBadge('Freq. crítico ≥', `${targets.frequencyCritical}x`)}
    {themeTargetBadge('Headline', `${targets.copyHeadlineMinChars}–${targets.copyHeadlineMaxChars} chars`)}
    {themeTargetBadge('Texto ≤', `${targets.copyPrimaryTextMaxChars} chars`)}
  </div>
);

const getSyncErrorMessage = (details: MetaSyncDetails | null | undefined) => {
  if (!details) return null;
  if (details.errorMessage) return details.errorMessage;
  if (typeof details.metadata?.error === 'string') return details.metadata.error;
  return null;
};

export function OptimizationCenter({ data, loading, creativeCoverage, creativeCoverageDetails }: OptimizationCenterProps) {
  const [showAll, setShowAll] = useState(false);
  const [showPlaybook, setShowPlaybook] = useState(false);

  const summary = data?.summary ?? null;
  const items = data?.items ?? EMPTY_ITEMS;

  const visibleItems = useMemo(() => (showAll ? items : items.slice(0, 8)), [items, showAll]);
  const generatedLabel = data?.generatedAt ? new Date(data.generatedAt).toLocaleString('pt-BR') : null;

  const showHighlights = !loading && Boolean(data?.highlights);
  const theme = data?.theme ?? null;

  const copyCandidates = data?.highlights
    ? [...(data.highlights.winners ?? []), ...(data.highlights.fatigued ?? []), ...(data.highlights.losers ?? [])]
    : [];

  const creativeCoverageClass =
    creativeCoverage?.state === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : creativeCoverage?.state === 'partial' || creativeCoverage?.state === 'running'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : creativeCoverage?.state === 'failed'
          ? 'border-rose-200 bg-rose-50 text-rose-800'
          : 'text-muted-foreground';

  const creativeSyncLevel = creativeCoverageDetails?.metadata?.syncLevel ? String(creativeCoverageDetails.metadata.syncLevel) : null;
  const creativeSyncRange = creativeCoverageDetails ? `${creativeCoverageDetails.dateRangeStart} → ${creativeCoverageDetails.dateRangeEnd}` : null;
  const creativeSyncTimestamp = creativeCoverageDetails
    ? new Date(creativeCoverageDetails.completedAt ?? creativeCoverageDetails.startedAt).toLocaleString('pt-BR')
    : null;

  const showCreativeCallout = creativeCoverage && creativeCoverage.state !== 'success' && creativeCoverage.state !== 'running';
  const creativeCalloutBaseClass =
    creativeCoverage?.state === 'failed' ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50';
  const creativeCalloutTextClass = creativeCoverage?.state === 'failed' ? 'text-rose-800' : 'text-amber-900';
  const creativeCalloutTextMutedClass = creativeCoverage?.state === 'failed' ? 'text-rose-800/80' : 'text-amber-900/80';
  const creativeCalloutTextSubtleClass = creativeCoverage?.state === 'failed' ? 'text-rose-800/70' : 'text-amber-900/70';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Centro de Otimização
          <Badge variant="outline">Playbook</Badge>
        </CardTitle>
        <CardDescription>Recomendações acionáveis para otimizar campanhas e criativos no período selecionado.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {creativeCoverage ? (
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
        ) : null}

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

        {theme ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Tema: {theme.themeName}</Badge>
              <Badge variant="secondary">
                detectado por {theme.matchedBy}
                {theme.matchedValue ? `: ${theme.matchedValue}` : ''}
              </Badge>
              <Badge variant="outline">playbook: {data?.playbookVersion ?? '—'}</Badge>
            </div>
            {renderTargets(theme.targets)}
          </div>
        ) : null}

        {summary && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge className={severityBadgeClass.critical}>crítico: {summary.critical}</Badge>
              <Badge className={severityBadgeClass.warning}>atenção: {summary.warning}</Badge>
              <Badge className={severityBadgeClass.opportunity}>oportunidade: {summary.opportunity}</Badge>
              <Badge className={severityBadgeClass.info}>info: {summary.info}</Badge>
            </div>
            {generatedLabel && <p className="text-xs text-muted-foreground">Atualizado: {generatedLabel}</p>}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando recomendações...</p>
        ) : visibleItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma recomendação no período (ainda). Se não há dados, tente sincronizar a Meta.
          </p>
        ) : (
          <div className="space-y-3">
            {visibleItems.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={severityBadgeClass[item.severity]}>
                        {severityLabel[item.severity]}
                      </Badge>
                      <Badge variant="outline">{categoryLabel[item.category]}</Badge>
                      {item.ruleId ? <Badge variant="secondary">{item.ruleId}</Badge> : null}
                      {item.entity?.name ? <p className="text-sm font-medium truncate max-w-[520px]">{item.entity.name}</p> : null}
                    </div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    {item.thresholds && Object.keys(item.thresholds).length > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        thresholds:{' '}
                        {Object.entries(item.thresholds)
                          .slice(0, 5)
                          .map(([k, v]) => `${k}=${v}`)
                          .join(' · ')}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            {items.length > 8 && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowAll((prev) => !prev)}>
                  {showAll ? 'Ver menos' : `Ver tudo (${items.length})`}
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setShowPlaybook((prev) => !prev)}>
            {showPlaybook ? 'Ocultar playbook' : 'Ver playbook (regras)'}
          </Button>
        </div>

        <PlaybookPanel open={showPlaybook} />

        {showHighlights && data?.highlights ? (
          <OptimizationHighlights winners={data.highlights.winners} fatigued={data.highlights.fatigued} losers={data.highlights.losers} />
        ) : null}

        <CopyLab candidates={copyCandidates} theme={theme ? { themeKey: theme.themeKey, themeName: theme.themeName } : null} />
      </CardContent>
    </Card>
  );
}

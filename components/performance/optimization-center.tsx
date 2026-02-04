'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { OptimizationCenterResponse, OptimizationCenterThemeTargets } from '@/types';

import { CopyLab } from './optimization-center/copy-lab';
import { OptimizationHighlights } from './optimization-center/highlights';
import { categoryLabel, severityBadgeClass, severityLabel } from './optimization-center/labels';
import { PlaybookPanel } from './optimization-center/playbook-panel';

interface OptimizationCenterProps {
  data: OptimizationCenterResponse | null;
  loading?: boolean;
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

export function OptimizationCenter({ data, loading }: OptimizationCenterProps) {
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

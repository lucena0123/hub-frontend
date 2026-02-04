'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCreativeCopyInsights, getOptimizationCenterPlaybook, generateCreativeCopyInsights } from '@/lib/api/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  OptimizationCenterResponse,
  OptimizationCenterSeverity,
  OptimizationCenterCategory,
  OptimizationCenterHighlight,
  OptimizationCenterPlaybook,
  OptimizationCenterThemeTargets,
  CreativeCopyInsightsResponse,
} from '@/types';

interface OptimizationCenterProps {
  data: OptimizationCenterResponse | null;
  loading?: boolean;
}

const severityLabel: Record<OptimizationCenterSeverity, string> = {
  critical: 'crítico',
  warning: 'atenção',
  opportunity: 'oportunidade',
  info: 'info',
};

const severityBadgeClass: Record<OptimizationCenterSeverity, string> = {
  critical: 'bg-rose-500 text-white border-rose-600',
  warning: 'bg-amber-400 text-amber-950 border-amber-500',
  opportunity: 'bg-emerald-500 text-white border-emerald-600',
  info: 'bg-muted text-muted-foreground border-border',
};

const categoryLabel: Record<OptimizationCenterCategory, string> = {
  campaign: 'campanha',
  creative: 'criativo',
  qualification: 'qualificação',
  data: 'dados',
};

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
};

const formatCpl = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value) || value <= 0) return '-';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
};

const formatCta = (value: string | null | undefined) => {
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

const renderHighlight = (title: string, badge: string, items: OptimizationCenterHighlight[]) => {
  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            {title}
            <Badge variant="outline">{badge}</Badge>
          </CardTitle>
          <CardDescription>Sem dados.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          {title}
          <Badge variant="outline">{badge}</Badge>
        </CardTitle>
        <CardDescription>Top 3 do período</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.slice(0, 3).map((c) => {
          const thumbnailUrl = c.thumbnailUrl;
          const cta = formatCta(c.ctaType);
          return (
            <div key={c.snapshotId} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 flex-none overflow-hidden rounded-md border bg-muted">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt="Preview do criativo"
                      className="h-full w-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium truncate max-w-[240px]">
                      {c.headline || 'Criativo'}
                    </p>
                    {cta && <Badge variant="outline">{cta}</Badge>}
                    {c.isDynamic && <Badge variant="secondary">dynamic</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.conversations.toLocaleString('pt-BR')} conversas · CPL {formatCpl(c.cpl)}
                  </p>
                </div>
              </div>
              <Badge variant="outline">{formatCurrency(c.spend)}</Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export function OptimizationCenter({ data, loading }: OptimizationCenterProps) {
  const [showAll, setShowAll] = useState(false);
  const [showPlaybook, setShowPlaybook] = useState(false);
  const [playbook, setPlaybook] = useState<OptimizationCenterPlaybook | null>(null);
  const [playbookLoading, setPlaybookLoading] = useState(false);
  const [playbookError, setPlaybookError] = useState<string | null>(null);
  const [selectedCopySnapshotId, setSelectedCopySnapshotId] = useState<string | null>(null);
  const [copyInsights, setCopyInsights] = useState<CreativeCopyInsightsResponse | null>(null);
  const [copyInsightsLoading, setCopyInsightsLoading] = useState(false);
  const [copyGenerateLoading, setCopyGenerateLoading] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!showPlaybook) {
        setPlaybookLoading(false);
        return;
      }

      if (playbook || playbookLoading) return;
      try {
        setPlaybookLoading(true);
        setPlaybookError(null);
        const result = await getOptimizationCenterPlaybook();
        if (!active) return;
        setPlaybook(result);
      } catch (err) {
        if (!active) return;
        setPlaybookError(err instanceof Error ? err.message : 'Falha ao carregar playbook.');
        setPlaybook(null);
      } finally {
        if (!active) return;
        setPlaybookLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [playbook, playbookLoading, showPlaybook]);

  const summary = data?.summary ?? null;
  const items = data?.items ?? [];

  const visibleItems = useMemo(() => (showAll ? items : items.slice(0, 8)), [items, showAll]);
  const generatedLabel = data?.generatedAt
    ? new Date(data.generatedAt).toLocaleString('pt-BR')
    : null;

  const showHighlights = !loading && Boolean(data?.highlights);
  const theme = data?.theme ?? null;

  const copyCandidates = useMemo(() => {
    if (!data?.highlights) return [];
    const list = [
      ...(data.highlights.winners ?? []),
      ...(data.highlights.fatigued ?? []),
      ...(data.highlights.losers ?? []),
    ];
    const unique = new Map<string, OptimizationCenterHighlight>();
    for (const item of list) {
      if (!unique.has(item.snapshotId)) unique.set(item.snapshotId, item);
    }
    return Array.from(unique.values());
  }, [data?.highlights]);

  useEffect(() => {
    if (selectedCopySnapshotId) return;
    if (copyCandidates.length === 0) return;
    setSelectedCopySnapshotId(copyCandidates[0].snapshotId);
  }, [copyCandidates, selectedCopySnapshotId]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!selectedCopySnapshotId) return;
      try {
        setCopyInsightsLoading(true);
        setCopyError(null);
        const result = await getCreativeCopyInsights(selectedCopySnapshotId);
        if (!active) return;
        setCopyInsights(result);
      } catch (err: unknown) {
        if (!active) return;
        const message =
          err && typeof err === 'object' && 'response' in err
            ? 'Sem análise ainda. Clique em “Gerar sugestões” para criar.'
            : err instanceof Error
              ? err.message
              : 'Falha ao carregar insights de copy.';
        setCopyError(message);
        setCopyInsights(null);
      } finally {
        if (!active) return;
        setCopyInsightsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [selectedCopySnapshotId]);

  const generateInsights = async (force?: boolean) => {
    if (!selectedCopySnapshotId) return;
    try {
      setCopyGenerateLoading(true);
      setCopyError(null);
      await generateCreativeCopyInsights(selectedCopySnapshotId, {
        themeKey: theme?.themeKey,
        themeName: theme?.themeName,
        force: Boolean(force),
      });
      const refreshed = await getCreativeCopyInsights(selectedCopySnapshotId);
      setCopyInsights(refreshed);
    } catch (err) {
      setCopyError(err instanceof Error ? err.message : 'Falha ao gerar insights de copy.');
      setCopyInsights(null);
    } finally {
      setCopyGenerateLoading(false);
    }
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Centro de Otimização
          <Badge variant="outline">Playbook</Badge>
        </CardTitle>
        <CardDescription>
          Recomendações acionáveis para otimizar campanhas e criativos no período selecionado.
        </CardDescription>
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
            {generatedLabel && (
              <p className="text-xs text-muted-foreground">Atualizado: {generatedLabel}</p>
            )}
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
                      {item.entity?.name ? (
                        <p className="text-sm font-medium truncate max-w-[520px]">
                          {item.entity.name}
                        </p>
                      ) : null}
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

        {showPlaybook ? (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            {playbookLoading ? (
              <p className="text-sm text-muted-foreground">Carregando playbook...</p>
            ) : playbookError ? (
              <p className="text-sm text-rose-600">{playbookError}</p>
            ) : playbook ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {playbook.key} · {playbook.version}
                  </p>
                  <p className="text-xs text-muted-foreground">Atualizado: {playbook.updatedAt}</p>
                </div>
                <p className="text-xs text-muted-foreground">{playbook.description}</p>
                <p className="text-xs text-muted-foreground">
                  Temas: {playbook.themes.length} · Regras: {playbook.rules.length}
                </p>
                <pre className="max-h-[420px] overflow-auto rounded-md bg-background p-3 text-xs">
                  {JSON.stringify(playbook, null, 2)}
                </pre>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sem playbook carregado.</p>
            )}
          </div>
        ) : null}

        {showHighlights && data?.highlights ? (
          <div className="grid gap-4 md:grid-cols-3">
            {renderHighlight('Criativos vencedores', 'winners', data.highlights.winners)}
            {renderHighlight('Criativos em fadiga', 'fadiga', data.highlights.fatigued)}
            {renderHighlight('Criativos a pausar', 'losers', data.highlights.losers)}
          </div>
        ) : null}

        {copyCandidates.length > 0 ? (
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                Sugestões de Copy (IA)
                <Badge variant="outline">Copy Lab</Badge>
              </CardTitle>
              <CardDescription>
                Baseado no snapshot do criativo (headline/texto/CTA). Gera variações de copy para você testar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={selectedCopySnapshotId ?? undefined}
                  onValueChange={(value) => setSelectedCopySnapshotId(value)}
                >
                  <SelectTrigger className="w-[420px]">
                    <SelectValue placeholder="Selecione um criativo" />
                  </SelectTrigger>
                  <SelectContent>
                    {copyCandidates.map((c) => (
                      <SelectItem key={c.snapshotId} value={c.snapshotId}>
                        {(c.headline || 'Criativo').slice(0, 80)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => generateInsights(false)}
                  disabled={copyGenerateLoading || !selectedCopySnapshotId}
                >
                  {copyGenerateLoading ? 'Gerando...' : 'Gerar sugestões'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => generateInsights(true)}
                  disabled={copyGenerateLoading || !selectedCopySnapshotId}
                >
                  Regenerar
                </Button>
              </div>

              {copyInsightsLoading ? (
                <p className="text-sm text-muted-foreground">Carregando insights de copy...</p>
              ) : copyError ? (
                <p className="text-sm text-muted-foreground">{copyError}</p>
              ) : copyInsights?.analysis ? (
                <div className="space-y-3 rounded-lg border bg-background p-3">
                  {copyInsights.analysis?.aiUsed === false ? (
                    <div className="space-y-1">
                      <p className="text-sm text-amber-700">
                        {copyInsights.errorMessage
                          ? 'IA indisponível no momento (OpenAI). Usando sugestões de fallback.'
                          : 'IA desabilitada: configure `OPENAI_API_KEY` no `backend/.env`.'}
                      </p>
                      {copyInsights.errorMessage ? (
                        <details className="text-xs text-muted-foreground">
                          <summary className="cursor-pointer select-none">Detalhe do erro</summary>
                          <pre className="mt-2 max-h-[160px] overflow-auto whitespace-pre-wrap rounded-md bg-muted/40 p-2">
                            {String(copyInsights.errorMessage).slice(0, 1000)}
                          </pre>
                        </details>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {copyInsights.analysis?.angle?.name ? (
                      <Badge variant="secondary">ângulo: {copyInsights.analysis.angle.name}</Badge>
                    ) : null}
                    {copyInsights.analysis?.persona ? (
                      <Badge variant="outline">persona: {String(copyInsights.analysis.persona).slice(0, 48)}</Badge>
                    ) : null}
                  </div>

                  {copyInsights.analysis?.hook ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Hook</p>
                      <p className="text-sm">{copyInsights.analysis.hook}</p>
                    </div>
                  ) : null}

                  {Array.isArray(copyInsights.analysis?.clarityIssues) && copyInsights.analysis.clarityIssues.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Problemas de clareza</p>
                      <ul className="list-disc pl-5 text-sm">
                        {copyInsights.analysis.clarityIssues.slice(0, 5).map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {Array.isArray(copyInsights.analysis?.complianceRisks) && copyInsights.analysis.complianceRisks.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Cuidados (compliance)</p>
                      <ul className="list-disc pl-5 text-sm">
                        {copyInsights.analysis.complianceRisks.slice(0, 5).map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {Array.isArray(copyInsights.analysis?.suggestions?.headlines) && copyInsights.analysis.suggestions.headlines.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Headlines sugeridas</p>
                      <ul className="list-disc pl-5 text-sm">
                        {copyInsights.analysis.suggestions.headlines.slice(0, 8).map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {Array.isArray(copyInsights.analysis?.suggestions?.primaryTexts) && copyInsights.analysis.suggestions.primaryTexts.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Textos (WhatsApp) sugeridos</p>
                      <ul className="list-disc pl-5 text-sm">
                        {copyInsights.analysis.suggestions.primaryTexts.slice(0, 6).map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {Array.isArray(copyInsights.analysis?.suggestions?.ctas) && copyInsights.analysis.suggestions.ctas.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">CTAs sugeridos</p>
                      <div className="flex flex-wrap gap-2">
                        {copyInsights.analysis.suggestions.ctas.slice(0, 6).map((item: string, idx: number) => (
                          <Badge key={idx} variant="outline">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {Array.isArray(copyInsights.analysis?.suggestions?.experiments) && copyInsights.analysis.suggestions.experiments.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Testes sugeridos</p>
                      <ul className="list-disc pl-5 text-sm">
                        {copyInsights.analysis.suggestions.experiments.slice(0, 4).map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sem insights ainda. Clique em “Gerar sugestões”.
                </p>
              )}
            </CardContent>
          </Card>
        ) : null}
      </CardContent>
    </Card>
  );
}

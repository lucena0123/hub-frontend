'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdSetMetric } from '@/types';
import {
  formatCurrency,
  formatDestinationLabel,
  formatOptionalNumber,
  formatOptimizationLabel,
  formatPercent,
  type AdSetObjectiveMeta,
} from './adset-table/helpers';
import { buildAdsetView } from './adset-table/adset-view';

interface AdSetTableProps {
  adsets: AdSetMetric[];
  loading?: boolean;
  objective?: string | null;
  objectiveMeta?: AdSetObjectiveMeta;
}

export function AdSetTable({ adsets, loading, objective, objectiveMeta }: AdSetTableProps) {
  const [expandedConfig, setExpandedConfig] = useState<Record<string, boolean>>({});

  if (loading) {
    return (
      <Card className="border-l-4 border-l-fuchsia-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Conjuntos de Anúncios</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-fuchsia-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          Conjuntos de Anúncios
          <Badge variant="outline">Conjuntos</Badge>
        </CardTitle>
        <CardDescription>Performance por publico/segmentacao</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {adsets.length === 0 ? (
            <div className="rounded-md border p-8 text-center text-muted-foreground">
              Nenhum dado de ad set no período selecionado. Se a campanha não teve entrega, isso é esperado; caso contrário, execute o sync com syncLevel &quot;adset&quot; ou &quot;full&quot;.
            </div>
          ) : (
            adsets.map((adset) => {
              const isConfigExpanded = Boolean(expandedConfig[adset.adsetId]);
              const toggleConfig = () =>
                setExpandedConfig((prev) => ({ ...prev, [adset.adsetId]: !prev[adset.adsetId] }));
              const {
                configDestination,
                configLines,
                configOptimization,
                objectiveKey,
                primaryLabel,
                pyramidLayers,
              } = buildAdsetView(adset, objective, objectiveMeta);

              return (
                <div key={adset.adsetId} className="rounded-[16px] border border-border/60 bg-card/70 p-5">
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,0.9fr)]">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <h4 className="text-base font-semibold leading-snug">
                          {adset.adsetName || adset.adsetId}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge
                            variant="outline"
                            className="text-[10px] border-primary/30 bg-primary/10 text-primary"
                            title="Objetivo inferido a partir do objetivo da campanha e da configuração do conjunto."
                          >
                            {objectiveKey === 'messages' ? 'Mensagens' : objectiveKey === 'traffic' ? 'Tráfego' : 'Conversões'}
                          </Badge>
                          {configDestination && (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              title="Destino configurado no conjunto (ex.: WhatsApp, Site)."
                            >
                              {formatDestinationLabel(String(configDestination))}
                            </Badge>
                          )}
                          {configOptimization && (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-amber-400/40 bg-amber-400/10 text-amber-200"
                              title="Meta de otimização definida no conjunto."
                            >
                              {formatOptimizationLabel(String(configOptimization))}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="rounded-md border border-border/60 bg-muted/10 p-3 text-[11px] text-muted-foreground space-y-1">
                        <p>Conjunto com foco em {objectiveKey === 'messages' ? 'conversas' : objectiveKey === 'traffic' ? 'visitas' : 'conversões'}.</p>
                        <p>Link clicks {formatOptionalNumber(adset.totalLinkClicks)} · CTR {formatPercent(adset.avgCtr, 2)}</p>
                        <p>
                          Status {adset.status ?? '—'} / {adset.effectiveStatus ?? '—'}
                        </p>
                        <Button variant="outline" size="xs" type="button" onClick={toggleConfig}>
                          {isConfigExpanded ? 'Ocultar configuração' : 'Ver configuração'}
                        </Button>
                      </div>
                      {isConfigExpanded && (
                        <div className="rounded-md border border-border/60 bg-muted/10 p-3 text-[11px] text-muted-foreground space-y-1">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Configuração do conjunto</p>
                          {configLines.length > 0 ? (
                            configLines.map((line) => (
                              <p key={line}>{line}</p>
                            ))
                          ) : (
                            <p>Sem configuração adicional registrada.</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Pirâmide do conjunto</p>
                      <div className="space-y-2">
                        {pyramidLayers.map((layer, index) => (
                          <div key={layer.title} className="rounded-md border border-border/60 bg-muted/10 p-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{layer.title}</span>
                              <span className="text-[10px] text-muted-foreground">{layer.primary}</span>
                            </div>
                            <div className="mt-1.5 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                              <div className="h-full rounded-full bg-primary/60" style={{ width: `${100 - index * 10}%`, margin: '0 auto' }} />
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                              {layer.metrics.map((metric) => (
                                <div key={`${layer.title}-${metric.label}`} className="flex items-center justify-between gap-2">
                                  <span>{metric.label}</span>
                                  <span className="text-foreground/80">{metric.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-md border border-border/60 p-3 bg-muted/20">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Investimento</p>
                          <p className="text-sm font-semibold">{formatCurrency(adset.totalSpend)}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">CPL {formatCurrency(adset.cpl)}</p>
                        </div>
                        <div className="rounded-md border border-border/60 p-3 bg-muted/20">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{primaryLabel.title}</p>
                          <p className="text-sm font-semibold">{primaryLabel.value}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">CTR {formatPercent(adset.avgCtr, 2)}</p>
                        </div>
                        <div className="rounded-md border border-border/60 p-3 bg-muted/20">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">CTR / CPC</p>
                          <p className="text-sm font-semibold">{formatPercent(adset.avgCtr, 2)}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">CPC {formatCurrency(adset.avgCpc)}</p>
                        </div>
                        <div className="rounded-md border border-border/60 p-3 bg-muted/20">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">CPM / Freq</p>
                          <p className="text-sm font-semibold">{formatCurrency(adset.avgCpm)}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{adset.avgFrequency.toFixed(1)}x</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

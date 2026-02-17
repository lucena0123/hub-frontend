'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdSetMetric } from '@/types';

interface AdSetTableProps {
  adsets: AdSetMetric[];
  loading?: boolean;
  objective?: string | null;
  objectiveMeta?: { destinationType?: string | null; optimizationGoal?: string | null } | null;
}

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString('pt-BR');
};

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value) || value === 0) return '-';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
};

const formatOptionalNumber = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return value.toLocaleString('pt-BR');
};

const formatPercent = (value: number, decimals = 1) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `${value.toFixed(decimals)}%`;
};

const formatDateLabel = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pt-BR');
};

const formatDestinationLabel = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.toUpperCase();
  if (normalized.includes('WHATSAPP')) return 'WhatsApp';
  if (normalized.includes('MESSENGER')) return 'Messenger';
  if (normalized.includes('INSTAGRAM')) return 'Instagram';
  if (normalized.includes('FACEBOOK')) return 'Facebook';
  if (normalized.includes('APP')) return 'App';
  if (normalized.includes('SITE')) return 'Site';
  if (normalized.includes('DIRECT') || normalized.includes('MESSAGING')) return 'Mensagens';
  return value.replace(/_/g, ' ');
};

const formatOptimizationLabel = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.toUpperCase();
  if (normalized.includes('CONVERSATION')) return 'Conversas';
  if (normalized.includes('MESSAGE') || normalized.includes('MESSAGING')) return 'Mensagens';
  if (normalized.includes('LEAD')) return 'Leads';
  if (normalized.includes('LANDING_PAGE')) return 'LP Views';
  if (normalized.includes('LINK_CLICK')) return 'Cliques no link';
  if (normalized.includes('PURCHASE') || normalized.includes('OFFSITE_CONVERSIONS')) return 'Compras';
  if (normalized.includes('REACH')) return 'Alcance';
  if (normalized.includes('IMPRESSIONS')) return 'Impressões';
  return value.replace(/_/g, ' ');
};

const resolveObjectiveKey = (
  objective?: string | null,
  objectiveMeta?: AdSetTableProps['objectiveMeta'] | null,
  adsetMeta?: AdSetMetric['metadata'] | null
) => {
  const raw = (objective ?? '').toLowerCase();
  const metaDestination = (objectiveMeta?.destinationType ?? '').toLowerCase();
  const metaOptimization = (objectiveMeta?.optimizationGoal ?? '').toLowerCase();
  const adsetDestination = (adsetMeta?.destinationType ?? '').toLowerCase();
  const adsetOptimization = (adsetMeta?.optimizationGoal ?? '').toLowerCase();

  if (adsetDestination.includes('message') || adsetDestination.includes('messaging') || adsetDestination.includes('whatsapp')) {
    return 'messages';
  }
  if (adsetOptimization.includes('message') || adsetOptimization.includes('messaging') || adsetOptimization.includes('conversation')) {
    return 'messages';
  }
  if (metaDestination.includes('message') || metaDestination.includes('messaging') || metaDestination.includes('whatsapp')) {
    return 'messages';
  }
  if (metaOptimization.includes('message') || metaOptimization.includes('messaging') || metaOptimization.includes('conversation')) {
    return 'messages';
  }

  if (raw.includes('message') || raw.includes('messaging')) return 'messages';
  if (raw.includes('lead')) return 'lead';
  if (raw.includes('traffic')) return 'traffic';
  if (raw.includes('video')) return 'video';
  if (raw.includes('engagement')) return 'engagement';
  if (raw.includes('awareness') || raw.includes('reach') || raw.includes('brand')) return 'awareness';
  if (raw.includes('conversion') || raw.includes('sales') || raw.includes('purchase')) return 'conversion';

  return 'conversion';
};

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
              const objectiveKey = resolveObjectiveKey(objective, objectiveMeta, adset.metadata ?? null);
              const configDestination = adset.metadata?.destinationType ?? null;
              const configOptimization = adset.metadata?.optimizationGoal ?? null;
              const configBilling = adset.metadata?.billingEvent ?? null;
              const configBidStrategy = adset.metadata?.bidStrategy ?? null;
              const configBidCap = adset.metadata?.bidCap ?? adset.metadata?.costCap ?? null;
              const configAttribution = adset.metadata?.attributionSpec ?? null;
              const configTargeting = adset.metadata?.targeting ?? null;
              const configStart = formatDateLabel(adset.metadata?.startTime ?? null);
              const configEnd = formatDateLabel(adset.metadata?.endTime ?? null);
              const placements = Array.isArray((configTargeting as any)?.publisher_platforms)
                ? (configTargeting as any).publisher_platforms
                : [];
              const ageMin = (configTargeting as any)?.age_min;
              const ageMax = (configTargeting as any)?.age_max;
              const genders = Array.isArray((configTargeting as any)?.genders)
                ? (configTargeting as any).genders.map((g: number) => (g === 1 ? 'Homens' : g === 2 ? 'Mulheres' : 'Todos')).join(', ')
                : null;
              const countries = Array.isArray((configTargeting as any)?.geo_locations?.countries)
                ? (configTargeting as any).geo_locations.countries
                : [];
              const targetingSummary = [
                ageMin || ageMax ? `Idade ${ageMin ?? '—'}-${ageMax ?? '—'}` : null,
                genders,
                countries.length > 0 ? `Países ${countries.slice(0, 2).join(', ')}${countries.length > 2 ? '…' : ''}` : null,
                placements.length > 0 ? `Placements ${placements.slice(0, 2).join(', ')}${placements.length > 2 ? '…' : ''}` : null,
              ].filter(Boolean);

              const attributionLabel = Array.isArray(configAttribution)
                ? configAttribution
                    .map((spec: any) => {
                      const window = spec?.window_days ?? spec?.window_days ?? spec?.event_type;
                      const event = spec?.event_type || '';
                      return `${window ?? ''}${event ? ` ${event}` : ''}`.trim();
                    })
                    .filter((s) => s.length > 0)
                    .join(', ')
                : null;

              const isConfigExpanded = Boolean(expandedConfig[adset.adsetId]);
              const toggleConfig = () =>
                setExpandedConfig((prev) => ({ ...prev, [adset.adsetId]: !prev[adset.adsetId] }));

              const configLines = [
                adset.dailyBudget ? `Orçamento diário ${formatCurrency(adset.dailyBudget)}` : null,
                adset.lifetimeBudget ? `Lifetime ${formatCurrency(adset.lifetimeBudget)}` : null,
                configBilling ? `Billing ${configBilling}` : null,
                configBidStrategy ? `Lance ${configBidStrategy}` : null,
                configBidCap ? `Cap ${configBidCap}` : null,
                configStart || configEnd ? `Período ${configStart ?? '—'} → ${configEnd ?? '—'}` : null,
                attributionLabel ? `Atribuição ${attributionLabel}` : null,
                targetingSummary.length > 0 ? `Público: ${targetingSummary.join(' · ')}` : null,
              ].filter(Boolean);

              const conversionRate = adset.totalClicks > 0 ? (adset.totalConversions / adset.totalClicks) * 100 : 0;
              const messageRate =
                adset.totalClicks > 0 ? (adset.totalMessagingConversations / adset.totalClicks) * 100 : 0;
              const lpRate =
                adset.totalClicks > 0 ? (adset.totalLandingPageViews / adset.totalClicks) * 100 : 0;
              const cpa = adset.totalConversions > 0 ? adset.totalSpend / adset.totalConversions : 0;

              const primaryLabel =
                objectiveKey === 'messages'
                  ? { title: 'Conversas', value: formatNumber(adset.totalMessagingConversations) }
                  : objectiveKey === 'traffic'
                    ? { title: 'LP Views', value: formatOptionalNumber(adset.totalLandingPageViews) }
                    : { title: 'Conversões', value: formatOptionalNumber(adset.totalConversions) };

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
                        {[
                          {
                            title: 'Base — Entrega',
                            primary: formatNumber(adset.totalImpressions),
                            metrics: [
                              { label: 'Impressões', value: formatNumber(adset.totalImpressions) },
                              { label: 'Alcance', value: formatNumber(adset.totalReach) },
                              { label: 'Frequência', value: `${adset.avgFrequency.toFixed(1)}x` },
                              { label: 'CPM', value: formatCurrency(adset.avgCpm) },
                            ],
                          },
                          {
                            title: 'Interação — Interesse',
                            primary: formatNumber(adset.totalClicks),
                            metrics: [
                              { label: 'Cliques', value: formatNumber(adset.totalClicks) },
                              { label: 'Link clicks', value: formatOptionalNumber(adset.totalLinkClicks) },
                              { label: 'CTR', value: formatPercent(adset.avgCtr, 2) },
                              { label: 'CPC', value: formatCurrency(adset.avgCpc) },
                            ],
                          },
                          {
                            title: 'Ação — Resultado',
                            primary: primaryLabel.value,
                            metrics: [
                              { label: primaryLabel.title, value: primaryLabel.value },
                              { label: 'Cliques→Resultado', value: formatPercent(
                                objectiveKey === 'messages' ? messageRate : objectiveKey === 'traffic' ? lpRate : conversionRate
                              ) },
                              { label: 'CPL', value: formatCurrency(adset.cpl) },
                              { label: 'CPA', value: formatCurrency(cpa) },
                            ],
                          },
                        ].map((layer, index) => (
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

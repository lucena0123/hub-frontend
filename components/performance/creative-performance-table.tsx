'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdCreativeMetric, CreativeLibraryResponse } from '@/types';

import { formatCta, formatCurrency, formatNumber, getDomainFromUrl, statusBadgeClass, statusLabel } from './creative-library/formatters';
import { formatCreativeType, rateColor, toStringArray } from './creative-performance-table/formatters';

type ObjectiveKey = 'messages' | 'lead' | 'traffic' | 'conversion' | 'video' | 'engagement' | 'awareness';

type MetricColumn = {
  key:
    | 'conversations'
    | 'leads'
    | 'conversions'
    | 'cpl'
    | 'clicks'
    | 'linkClicks'
    | 'lpViews'
    | 'lpRate'
    | 'ctr'
    | 'cpc'
    | 'cpa'
    | 'convRate'
    | 'messageRate'
    | 'cpm'
    | 'impressions'
    | 'reach'
    | 'frequency'
    | 'video3s'
    | 'thruplay'
    | 'hookRate'
    | 'holdRate'
    | 'invest';
  label: string;
};

interface CreativePerformanceTableProps {
  ads: AdCreativeMetric[];
  loading?: boolean;
  creativeLibraryData?: CreativeLibraryResponse | null;
  objective?: string | null;
  objectiveMeta?: {
    optimizationGoal?: string | null;
    destinationType?: string | null;
    billingEvent?: string | null;
  } | null;
}

type PyramidMetric = {
  label: string;
  value: string;
};

type PyramidLayer = {
  key: string;
  title: string;
  primary: string;
  metrics: PyramidMetric[];
};

const DetailRow = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex items-start justify-between gap-3 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right text-foreground/90">{value && value.length > 0 ? value : '—'}</span>
  </div>
);

const formatOptionalNumber = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return value.toLocaleString('pt-BR');
};

const formatPercent = (value: number, decimals = 1) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `${value.toFixed(decimals)}%`;
};

const formatDestinationDomain = (domain?: string | null) => {
  if (!domain) return null;
  const normalized = domain.toLowerCase();
  if (normalized.includes('whatsapp')) return 'WhatsApp';
  if (normalized.includes('messenger')) return 'Messenger';
  if (normalized.includes('instagram')) return 'Instagram';
  if (normalized.includes('facebook')) return 'Facebook';
  return domain;
};

const parseWhatsAppInfo = (url?: string | null) => {
  if (!url) return { number: null, message: null };
  try {
    const parsed = new URL(url);
    const phone = parsed.searchParams.get('phone') || parsed.searchParams.get('phone_number');
    const text = parsed.searchParams.get('text');
    let number = phone ? phone.replace(/[^\d]/g, '') : null;
    if (!number && parsed.hostname.includes('wa.me')) {
      const waPath = parsed.pathname.replace('/', '').trim();
      if (waPath) number = waPath.replace(/[^\d]/g, '');
    }
    return { number, message: text ? decodeURIComponent(text) : null };
  } catch {
    return { number: null, message: null };
  }
};

const parseWelcomeMessage = (assetFeedSpec: any): string | null => {
  if (!assetFeedSpec) return null;
  const raw = assetFeedSpec?.additional_data?.page_welcome_message;
  if (!raw || typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw);
    const text =
      parsed?.text_format?.message?.text ??
      parsed?.image_format?.message?.text ??
      parsed?.video_format?.message?.text ??
      null;
    return typeof text === 'string' && text.trim().length > 0 ? text : null;
  } catch {
    return null;
  }
};

const withCacheBust = (url: string | null | undefined, seed?: string | null) => {
  if (!url) return null;
  const token = seed && seed.length > 0 ? seed : '1';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(token)}`;
};

const collectCreativeImages = (params: {
  creative: AdCreativeMetric['creative'] | null;
  derived?: any;
  assetFeedSpec?: any;
  objectStorySpec?: any;
}) => {
  const urls: string[] = [];
  const pushUrl = (value?: string | null) => {
    if (!value || typeof value !== 'string') return;
    if (!urls.includes(value)) urls.push(value);
  };

  // Prefer the full image first, fallback to derived URLs, then thumbnails last.
  pushUrl(params.creative?.imageUrl ?? null);
  const derivedUrls = Array.isArray(params.derived?.images?.urls) ? params.derived.images.urls : [];
  derivedUrls.forEach((url: string) => pushUrl(url));

  const assetImages = Array.isArray(params.assetFeedSpec?.images) ? params.assetFeedSpec.images : [];
  for (const img of assetImages) {
    pushUrl(img?.url ?? img?.image_url ?? img?.imageUrl ?? null);
  }

  const spec = params.objectStorySpec;
  pushUrl(spec?.link_data?.picture ?? null);
  pushUrl(spec?.photo_data?.image_url ?? null);
  if (Array.isArray(spec?.child_attachments)) {
    for (const attachment of spec.child_attachments) {
      pushUrl(attachment?.image_url ?? attachment?.picture ?? null);
    }
  }

  pushUrl(params.creative?.thumbnailUrl ?? null);

  return urls;
};

const resolveObjectiveKey = (
  objective: string | null | undefined,
  objectiveMeta: CreativePerformanceTableProps['objectiveMeta'],
  ads: AdCreativeMetric[]
): ObjectiveKey => {
  const raw = (objective ?? '').toLowerCase();
  const metaDestination = (objectiveMeta?.destinationType ?? '').toLowerCase();
  const metaOptimization = (objectiveMeta?.optimizationGoal ?? '').toLowerCase();

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

  if (ads.some((ad) => ad.totalMessagingConversations > 0)) return 'messages';
  if (ads.some((ad) => ad.totalConversions > 0)) return 'conversion';
  if (ads.some((ad) => ad.totalLandingPageViews > 0)) return 'traffic';
  return 'traffic';
};

const buildColumns = (objectiveKey: ObjectiveKey, hasVideoData: boolean): MetricColumn[] => {
  switch (objectiveKey) {
    case 'messages':
      return [
        { key: 'conversations', label: 'Conversas' },
        { key: 'cpl', label: 'CPL' },
        { key: 'messageRate', label: 'Cliques→Conversas' },
        { key: 'ctr', label: 'CTR' },
        { key: 'cpc', label: 'CPC' },
        { key: 'invest', label: 'Investimento' },
      ];
    case 'lead':
      return [
        { key: 'leads', label: 'Leads' },
        { key: 'cpl', label: 'CPL' },
        { key: 'convRate', label: 'Cliques→Leads' },
        { key: 'ctr', label: 'CTR' },
        { key: 'cpc', label: 'CPC' },
        { key: 'invest', label: 'Investimento' },
      ];
    case 'traffic':
      return [
        { key: 'linkClicks', label: 'Link clicks' },
        { key: 'ctr', label: 'CTR' },
        { key: 'cpc', label: 'CPC' },
        { key: 'lpViews', label: 'LP views' },
        { key: 'lpRate', label: 'LP rate' },
        { key: 'invest', label: 'Investimento' },
      ];
    case 'conversion':
      return [
        { key: 'conversions', label: 'Conversões' },
        { key: 'cpa', label: 'CPA' },
        { key: 'convRate', label: 'Conv %' },
        { key: 'ctr', label: 'CTR' },
        { key: 'cpc', label: 'CPC' },
        { key: 'invest', label: 'Investimento' },
      ];
    case 'video':
      if (!hasVideoData) {
        return buildColumns('traffic', hasVideoData);
      }
      return [
        { key: 'video3s', label: '3s views' },
        { key: 'thruplay', label: 'ThruPlay' },
        { key: 'hookRate', label: 'Hook' },
        { key: 'holdRate', label: 'Hold' },
        { key: 'ctr', label: 'CTR' },
        { key: 'invest', label: 'Investimento' },
      ];
    case 'engagement':
      return [
        { key: 'clicks', label: 'Cliques' },
        { key: 'ctr', label: 'CTR' },
        { key: 'cpc', label: 'CPC' },
        { key: 'cpm', label: 'CPM' },
        { key: 'impressions', label: 'Impressões' },
        { key: 'invest', label: 'Investimento' },
      ];
    case 'awareness':
      return [
        { key: 'impressions', label: 'Impressões' },
        { key: 'reach', label: 'Alcance' },
        { key: 'frequency', label: 'Frequência' },
        { key: 'cpm', label: 'CPM' },
        { key: 'ctr', label: 'CTR' },
        { key: 'invest', label: 'Investimento' },
      ];
    default:
      return buildColumns('traffic', hasVideoData);
  }
};

const buildCreativePyramid = (ad: AdCreativeMetric, objectiveKey: ObjectiveKey): PyramidLayer[] => {
  const clicks = ad.totalClicks || 0;
  const linkClicks = ad.totalLinkClicks || 0;
  const lpViews = ad.totalLandingPageViews || 0;
  const conversations = ad.totalMessagingConversations || 0;
  const leads = ad.totalLeads ?? 0;
  const purchases = ad.totalPurchases ?? 0;
  const conversions =
    objectiveKey === 'lead'
      ? leads
      : objectiveKey === 'conversion'
        ? purchases > 0
          ? purchases
          : ad.totalConversions || 0
        : ad.totalConversions || 0;
  const cpc = clicks > 0 ? ad.totalSpend / clicks : 0;
  const cpa = conversions > 0 ? ad.totalSpend / conversions : 0;
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
  const messageRate = clicks > 0 ? (conversations / clicks) * 100 : 0;
  const lpBaseClicks = linkClicks > 0 ? linkClicks : clicks;
  const lpRate = lpBaseClicks > 0 ? (lpViews / lpBaseClicks) * 100 : 0;
  const frequency = ad.totalReach > 0 ? ad.totalImpressions / ad.totalReach : 0;

  const base: PyramidLayer = {
    key: 'base',
    title: 'Base — Entrega',
    primary: formatOptionalNumber(ad.totalImpressions),
    metrics: [
      { label: 'Impressões', value: formatOptionalNumber(ad.totalImpressions) },
      { label: 'Alcance', value: formatOptionalNumber(ad.totalReach) },
      { label: 'Frequência', value: frequency > 0 ? `${frequency.toFixed(1)}x` : '—' },
      { label: 'CPM', value: formatCurrency(ad.avgCpm) },
    ],
  };

  const interaction: PyramidLayer = {
    key: 'interaction',
    title: 'Interação — Interesse inicial',
    primary: formatOptionalNumber(clicks),
    metrics: [
      { label: 'Cliques', value: formatOptionalNumber(clicks) },
      { label: 'Link clicks', value: formatOptionalNumber(linkClicks) },
      { label: 'CTR', value: formatPercent(ad.avgCtr, 2) },
      { label: 'CPC', value: formatCurrency(cpc) },
    ],
  };

  const action: PyramidLayer = (() => {
    if (objectiveKey === 'messages') {
      return {
        key: 'action',
        title: 'Ação — Conversas',
        primary: formatOptionalNumber(conversations),
        metrics: [
          { label: 'Conversas', value: formatOptionalNumber(conversations) },
          { label: 'Cliques→Conversas', value: formatPercent(messageRate) },
          { label: 'CPL', value: formatCurrency(ad.cpl) },
          { label: 'Custo por conversa', value: formatCurrency(ad.cpl) },
        ],
      };
    }
    if (objectiveKey === 'lead') {
      return {
        key: 'action',
        title: 'Ação — Leads',
        primary: formatOptionalNumber(conversions),
        metrics: [
          { label: 'Leads', value: formatOptionalNumber(conversions) },
          { label: 'Cliques→Leads', value: formatPercent(conversionRate) },
          { label: 'CPL', value: formatCurrency(ad.cpl) },
          { label: 'CPA', value: formatCurrency(cpa) },
        ],
      };
    }
    if (objectiveKey === 'traffic') {
      return {
        key: 'action',
        title: 'Ação — Visitas',
        primary: formatOptionalNumber(lpViews),
        metrics: [
          { label: 'LP views', value: formatOptionalNumber(lpViews) },
          { label: 'LP rate', value: formatPercent(lpRate) },
          { label: 'Link clicks', value: formatOptionalNumber(linkClicks) },
          { label: 'CTR', value: formatPercent(ad.avgCtr, 2) },
        ],
      };
    }
    if (objectiveKey === 'conversion') {
      return {
        key: 'action',
        title: 'Ação — Conversões',
        primary: formatOptionalNumber(conversions),
        metrics: [
          { label: 'Conversões', value: formatOptionalNumber(conversions) },
          { label: 'Conv %', value: formatPercent(conversionRate) },
          { label: 'CPA', value: formatCurrency(cpa) },
          { label: 'CPL', value: formatCurrency(ad.cpl) },
        ],
      };
    }
    if (objectiveKey === 'video') {
      return {
        key: 'action',
        title: 'Ação — Vídeo',
        primary: formatOptionalNumber(ad.video3secViews),
        metrics: [
          { label: '3s views', value: formatOptionalNumber(ad.video3secViews) },
          { label: 'ThruPlay', value: formatOptionalNumber(ad.videoThruplay) },
          { label: 'Hook', value: ad.hookRate > 0 ? `${ad.hookRate.toFixed(1)}%` : '—' },
          { label: 'Hold', value: ad.holdRate > 0 ? `${ad.holdRate.toFixed(1)}%` : '—' },
        ],
      };
    }
    if (objectiveKey === 'engagement') {
      return {
        key: 'action',
        title: 'Ação — Engajamento',
        primary: formatOptionalNumber(clicks),
        metrics: [
          { label: 'Cliques', value: formatOptionalNumber(clicks) },
          { label: 'CTR', value: formatPercent(ad.avgCtr, 2) },
          { label: 'CPC', value: formatCurrency(cpc) },
          { label: 'CPM', value: formatCurrency(ad.avgCpm) },
        ],
      };
    }
    return {
      key: 'action',
      title: 'Ação — Alcance',
      primary: formatOptionalNumber(ad.totalReach),
      metrics: [
        { label: 'Alcance', value: formatOptionalNumber(ad.totalReach) },
        { label: 'Frequência', value: frequency > 0 ? `${frequency.toFixed(1)}x` : '—' },
        { label: 'CPM', value: formatCurrency(ad.avgCpm) },
        { label: 'CTR', value: formatPercent(ad.avgCtr, 2) },
      ],
    };
  })();

  return [base, interaction, action];
};

const buildMetricTooltip = (params: {
  key: MetricColumn['key'];
  spend: number;
  impressions: number;
  clicks: number;
  linkClicks: number;
  lpViews: number;
  conversations: number;
  leads: number;
  purchases: number;
  conversions: number;
  objectiveKey: ObjectiveKey;
  video3s: number;
  thruplay: number;
  reach: number;
}) => {
  const {
    key,
    spend,
    impressions,
    clicks,
    linkClicks,
    lpViews,
    conversations,
    leads,
    purchases,
    conversions,
    objectiveKey,
    video3s,
    thruplay,
    reach,
  } = params;

  const sourceMeta = 'Fonte: Meta Ads (insights)';
  const sourceCalc = 'Fonte: cálculo (totais do período)';

  switch (key) {
    case 'conversations':
    case 'leads':
    case 'clicks':
    case 'linkClicks':
    case 'lpViews':
    case 'impressions':
    case 'reach':
    case 'video3s':
    case 'thruplay':
    case 'invest':
      return { source: sourceMeta, formula: 'Valor bruto do Meta Ads.' };
    case 'conversions': {
      const label =
        objectiveKey === 'lead'
          ? 'leads'
          : objectiveKey === 'conversion'
            ? purchases > 0
              ? 'compras'
              : 'conversões'
            : 'conversões';
      return { source: sourceMeta, formula: `Valor bruto do Meta Ads (${label}).` };
    }
    case 'ctr':
      return {
        source: sourceCalc,
        formula: `CTR = ${formatOptionalNumber(clicks)} ÷ ${formatOptionalNumber(impressions)} × 100`,
      };
    case 'cpc':
      return {
        source: sourceCalc,
        formula: `CPC = ${formatCurrency(spend)} ÷ ${formatOptionalNumber(clicks)}`,
      };
    case 'cpm':
      return {
        source: sourceCalc,
        formula: `CPM = ${formatCurrency(spend)} ÷ ${formatOptionalNumber(impressions)} × 1000`,
      };
    case 'frequency':
      return {
        source: sourceCalc,
        formula: `Frequência = ${formatOptionalNumber(impressions)} ÷ ${formatOptionalNumber(reach)}`,
      };
    case 'cpl': {
      const baseLabel =
        objectiveKey === 'messages'
          ? 'conversas'
          : objectiveKey === 'lead'
            ? 'leads'
            : objectiveKey === 'conversion'
              ? 'conversões'
              : 'contatos';
      const baseValue =
        objectiveKey === 'messages'
          ? conversations
          : objectiveKey === 'lead'
            ? leads
            : objectiveKey === 'conversion'
              ? conversions
              : conversions;
      return {
        source: sourceCalc,
        formula: `CPL = ${formatCurrency(spend)} ÷ ${formatOptionalNumber(baseValue)} (${baseLabel})`,
      };
    }
    case 'cpa':
      return {
        source: sourceCalc,
        formula: `CPA = ${formatCurrency(spend)} ÷ ${formatOptionalNumber(conversions)}`,
      };
    case 'convRate': {
      const baseLabel = objectiveKey === 'lead' ? 'leads' : 'conversões';
      return {
        source: sourceCalc,
        formula: `Conv% = ${formatOptionalNumber(conversions)} (${baseLabel}) ÷ ${formatOptionalNumber(clicks)} × 100`,
      };
    }
    case 'messageRate':
      return {
        source: sourceCalc,
        formula: `Cliques→Conversas = ${formatOptionalNumber(conversations)} ÷ ${formatOptionalNumber(clicks)} × 100`,
      };
    case 'lpRate': {
      const base = linkClicks > 0 ? linkClicks : clicks;
      const baseLabel = linkClicks > 0 ? 'link clicks' : 'cliques';
      return {
        source: sourceCalc,
        formula: `LP rate = ${formatOptionalNumber(lpViews)} ÷ ${formatOptionalNumber(base)} (${baseLabel}) × 100`,
      };
    }
    case 'hookRate':
      return {
        source: sourceCalc,
        formula: `Hook = ${formatOptionalNumber(video3s)} ÷ ${formatOptionalNumber(impressions)} × 100`,
      };
    case 'holdRate':
      return {
        source: sourceCalc,
        formula: `Hold = ${formatOptionalNumber(thruplay)} ÷ ${formatOptionalNumber(video3s)} × 100`,
      };
    default:
      return null;
  }
};

export function CreativePerformanceTable({
  ads,
  loading,
  creativeLibraryData,
  objective,
  objectiveMeta,
}: CreativePerformanceTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const sortedAds = useMemo(() => {
    return [...ads].sort((a, b) => (b.totalSpend || 0) - (a.totalSpend || 0));
  }, [ads]);

  const libraryLookup = useMemo(() => {
    const map = new Map<string, { status: NonNullable<CreativeLibraryResponse['creatives']>[number]['status']; reasons: NonNullable<NonNullable<CreativeLibraryResponse['creatives']>[number]['analysis']>['reasons'] }>();
    if (!creativeLibraryData?.creatives) return map;
    for (const c of creativeLibraryData.creatives) {
      if (c.snapshotId && c.status !== 'neutral') {
        map.set(c.snapshotId, { status: c.status, reasons: c.analysis?.reasons ?? [] });
      }
    }
    return map;
  }, [creativeLibraryData]);

  const hasVideoData = sortedAds.some((ad) => ad.video3secViews > 0 || ad.videoThruplay > 0);
  const objectiveKey = useMemo(() => resolveObjectiveKey(objective, objectiveMeta, sortedAds), [objective, objectiveMeta, sortedAds]);
  const columns = useMemo(() => buildColumns(objectiveKey, hasVideoData), [objectiveKey, hasVideoData]);
  const showVideoMetrics = objectiveKey === 'video' && hasVideoData;
 
  if (loading) {
    return (
      <Card className="border-l-4 border-l-pink-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Performance de Criativos</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-pink-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          Performance de Criativos
          <Badge variant="outline">Anúncios</Badge>
        </CardTitle>
        <CardDescription>Análise individual de cada anúncio{showVideoMetrics ? ' com métricas de vídeo' : ''}</CardDescription>
      </CardHeader>
      <CardContent>
        {sortedAds.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nenhum dado de criativos no período selecionado. Se a campanha não teve entrega, isso é esperado; caso contrário, execute o sync com syncLevel &quot;ad&quot; ou &quot;full&quot;.
          </div>
        ) : (
          <div className="space-y-4">
            {sortedAds.map((ad) => {
              const snapshotId = ad.creative?.snapshotId || ad.creativeSnapshotId || null;
              const rowKey = snapshotId ? `${ad.adId}:${snapshotId}` : ad.adId;
              const isExpanded = Boolean(snapshotId && expanded.has(rowKey));

              const libraryEntry = snapshotId ? libraryLookup.get(snapshotId) : undefined;

              const creative = ad.creative || null;
              const primaryText = creative?.primaryText || null;
                const objectStorySpec = (creative as any)?.objectStorySpec ?? null;
                const assetFeedSpec = (creative as any)?.assetFeedSpec ?? null;
                const derived = (creative as any)?.raw?.__derived ?? null;
                const imageUrls = collectCreativeImages({
                  creative,
                  derived,
                  assetFeedSpec,
                  objectStorySpec,
                });
                const imageUrlsForDisplay = imageUrls
                  .map((url) => withCacheBust(url, snapshotId))
                  .filter((url): url is string => Boolean(url));
                const mainImageRaw = imageUrls[0] ?? null;
                const mainImage = imageUrlsForDisplay[0] ?? null;
                const isThumbnailOnly = Boolean(mainImageRaw && mainImageRaw === creative?.thumbnailUrl && !creative?.imageUrl);
                const domain = getDomainFromUrl(creative?.destinationUrl);
                const destinationLabel = formatDestinationDomain(domain);
                const ctaLabel = formatCta(creative?.ctaType);
                const typeLabel = formatCreativeType(creative?.format, Boolean(creative?.isDynamic));
                const thumbnailUrl = mainImage ?? withCacheBust(creative?.imageUrl, snapshotId) ?? withCacheBust(creative?.thumbnailUrl, snapshotId) ?? null;

                const headlines = toStringArray(creative?.headlines);
                const primaryTexts = toStringArray(creative?.primaryTexts);
                const descriptions = toStringArray((creative as any)?.descriptions);
                const ctas = toStringArray(creative?.ctaTypes);
                const urls = toStringArray(creative?.destinationUrls);
                const creativeHeadline = creative?.headline || headlines[0] || null;
                const creativeDescription = creative?.description || descriptions[0] || null;
                const derivedIdentity = derived?.identity ?? null;
                const derivedWhatsapp = derived?.whatsapp ?? null;
              const storyType = objectStorySpec?.video_data
                ? 'Vídeo'
                : objectStorySpec?.link_data
                  ? 'Link'
                  : objectStorySpec?.photo_data
                    ? 'Imagem'
                    : objectStorySpec?.template_data
                      ? 'Template'
                      : '—';
              const pageId = objectStorySpec?.page_id ?? null;
              const instagramActorId = objectStorySpec?.instagram_actor_id ?? objectStorySpec?.instagram_user_id ?? null;
              const identityLabel =
                [
                  derivedIdentity?.pageName ? `Página ${derivedIdentity.pageName}` : pageId ? `Página ${pageId}` : null,
                  derivedIdentity?.instagramUsername
                    ? `Instagram @${derivedIdentity.instagramUsername}`
                    : instagramActorId
                      ? `Instagram ${instagramActorId}`
                      : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || '—';
              const whatsappFromUrl = parseWhatsAppInfo(creative?.destinationUrl);
              const whatsappNumber = derivedWhatsapp?.number || whatsappFromUrl.number;
              const welcomeMessage = parseWelcomeMessage(assetFeedSpec);
              const whatsappMessage = derivedWhatsapp?.prefillMessage || whatsappFromUrl.message || welcomeMessage;
              const assetSummaryParts = [
                headlines.length ? `Títulos ${headlines.length}` : null,
                primaryTexts.length ? `Textos ${primaryTexts.length}` : null,
                descriptions.length ? `Descrições ${descriptions.length}` : null,
                ctas.length ? `CTAs ${ctas.length}` : null,
                urls.length ? `URLs ${urls.length}` : null,
              ].filter(Boolean);
              const assetSummary = assetSummaryParts.length > 0 ? assetSummaryParts.join(' · ') : '—';

              const clicks = ad.totalClicks || 0;
              const leads = ad.totalLeads ?? 0;
              const purchases = ad.totalPurchases ?? 0;
              const conversions =
                objectiveKey === 'lead'
                  ? leads
                  : objectiveKey === 'conversion'
                    ? purchases > 0
                      ? purchases
                      : ad.totalConversions || 0
                    : ad.totalConversions || 0;
              const cpc = clicks > 0 ? ad.totalSpend / clicks : 0;
              const cpa = conversions > 0 ? ad.totalSpend / conversions : 0;
              const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
              const conversationRate = clicks > 0 ? (ad.totalMessagingConversations / clicks) * 100 : 0;
              const lpBaseClicks = ad.totalLinkClicks > 0 ? ad.totalLinkClicks : clicks;
              const lpRate = lpBaseClicks > 0 ? (ad.totalLandingPageViews / lpBaseClicks) * 100 : 0;
              const frequency = ad.totalReach > 0 ? ad.totalImpressions / ad.totalReach : 0;

              const metricValues: Record<string, string> = {
                conversations: formatNumber(ad.totalMessagingConversations),
                leads: formatNumber(leads || ad.totalConversions),
                conversions: formatNumber(conversions),
                cpl: formatCurrency(ad.cpl),
                clicks: formatNumber(ad.totalClicks),
                linkClicks: formatOptionalNumber(ad.totalLinkClicks),
                lpViews: formatOptionalNumber(ad.totalLandingPageViews),
                lpRate: formatPercent(lpRate),
                ctr: formatPercent(ad.avgCtr, 2),
                cpc: formatCurrency(cpc),
                cpa: formatCurrency(cpa),
                convRate: formatPercent(conversionRate),
                messageRate: formatPercent(conversationRate),
                cpm: formatCurrency(ad.avgCpm),
                impressions: formatOptionalNumber(ad.totalImpressions),
                reach: formatOptionalNumber(ad.totalReach),
                frequency: frequency > 0 ? `${frequency.toFixed(1)}x` : '—',
                video3s: formatOptionalNumber(ad.video3secViews),
                thruplay: formatOptionalNumber(ad.videoThruplay),
                hookRate: ad.hookRate > 0 ? `${ad.hookRate.toFixed(1)}%` : '—',
                holdRate: ad.holdRate > 0 ? `${ad.holdRate.toFixed(1)}%` : '—',
                invest: formatCurrency(ad.totalSpend),
              };

              const pyramidLayers = buildCreativePyramid(ad, objectiveKey);

              return (
                <div key={rowKey} className="rounded-[16px] border border-border/60 bg-card/70 p-5">
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,0.9fr)]">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 flex-none overflow-hidden rounded-[4px] border bg-muted">
                          {thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumbnailUrl} alt="Preview do criativo" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium leading-snug">{ad.adName || creative?.headline || ad.adId}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {libraryEntry?.status && (
                              <Badge
                                variant="outline"
                                className={statusBadgeClass[libraryEntry.status]}
                                title="Status do criativo baseado em performance recente."
                              >
                                {statusLabel[libraryEntry.status]}
                              </Badge>
                            )}
                            {ctaLabel && (
                              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary" title="CTA configurado no anúncio.">
                                {ctaLabel}
                              </Badge>
                            )}
                            {typeLabel && (
                              <Badge variant="secondary" title="Formato do criativo.">
                                {typeLabel}
                              </Badge>
                            )}
                            {destinationLabel && (
                              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300" title="Destino do anúncio.">
                                {destinationLabel}
                              </Badge>
                            )}
                            {!creative && <Badge variant="outline">sem snapshot</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate max-w-[420px]">
                            {creative?.headline || ad.adId}
                            {snapshotId ? ` · snapshot ${snapshotId.slice(0, 8)}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-md border border-border/60 bg-muted/10 p-3 text-[11px] text-muted-foreground">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Resumo rápido</p>
                        <div className="mt-2 space-y-1">
                          <p>CTR {formatPercent(ad.avgCtr, 2)} · CPC {formatCurrency(cpc)} · CPM {formatCurrency(ad.avgCpm)}</p>
                          <p>
                            {objectiveKey === 'lead'
                              ? `Leads ${formatOptionalNumber(conversions)}`
                              : objectiveKey === 'conversion'
                                ? `Conversões ${formatOptionalNumber(conversions)}`
                                : `Conversões ${formatOptionalNumber(ad.totalConversions)}`}
                            {' '}· Conv {formatPercent(conversionRate)}
                          </p>
                          {objectiveKey === 'messages' && (
                            <p>Conversas {formatOptionalNumber(ad.totalMessagingConversations)} · Cliques→Conversas {formatPercent(conversationRate)}</p>
                          )}
                        </div>
                      </div>

                      {snapshotId && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-fit"
                          onClick={() => {
                            setExpanded((prev) => {
                              const next = new Set(prev);
                              if (next.has(rowKey)) next.delete(rowKey);
                              else next.add(rowKey);
                              return next;
                            });
                          }}
                        >
                          {isExpanded ? (
                            <>
                              Ocultar detalhes <ChevronUp className="ml-2 h-4 w-4" />
                            </>
                          ) : (
                            <>
                              Ver detalhes <ChevronDown className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">PIRÂMIDE DO CRIATIVO</p>
                      <div className="space-y-2">
                        {pyramidLayers.map((layer, index) => {
                          const width = 100 - index * 10;
                          return (
                            <div key={layer.key} className="rounded-md border border-border/60 bg-muted/10 p-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{layer.title}</span>
                                <span className="text-[10px] text-muted-foreground">{layer.primary}</span>
                              </div>
                              <div className="mt-1.5 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary/60"
                                  style={{ width: `${width}%`, margin: '0 auto' }}
                                />
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                                {layer.metrics.map((metric) => (
                                  <div key={`${layer.key}-${metric.label}`} className="flex items-center justify-between gap-2">
                                    <span>{metric.label}</span>
                                    <span className="text-foreground/80">{metric.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {columns.map((column) => {
                          const value = metricValues[column.key] ?? '—';
                          const tooltip = buildMetricTooltip({
                            key: column.key,
                            spend: ad.totalSpend,
                            impressions: ad.totalImpressions,
                            clicks,
                            linkClicks: ad.totalLinkClicks,
                            lpViews: ad.totalLandingPageViews,
                            conversations: ad.totalMessagingConversations,
                            leads,
                            purchases,
                            conversions,
                            objectiveKey,
                            video3s: ad.video3secViews,
                            thruplay: ad.videoThruplay,
                            reach: ad.totalReach,
                          });
                          return (
                            <div key={column.key} className="relative group rounded-md border border-border/60 p-3 bg-muted/20">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{column.label}</p>
                              <p className="text-sm font-semibold">
                                {column.key === 'hookRate' ? <span className={rateColor(ad.hookRate, 'hook')}>{value}</span> : null}
                                {column.key === 'holdRate' ? <span className={rateColor(ad.holdRate, 'hold')}>{value}</span> : null}
                                {column.key !== 'hookRate' && column.key !== 'holdRate' ? value : null}
                              </p>
                              {tooltip ? (
                                <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-64 rounded-md border border-border/60 bg-background/95 p-2 text-[11px] text-muted-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{tooltip.source}</p>
                                  <p className="mt-1">{tooltip.formula}</p>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {isExpanded && snapshotId ? (
                    <div className="mt-5 space-y-4 rounded-md border border-border/60 bg-muted/10 p-4 text-sm">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Diagnóstico</p>
                        <div className="mt-2 grid gap-3 md:grid-cols-2">
                          <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Status & motivos</p>
                            {libraryEntry?.reasons && libraryEntry.reasons.length > 0 ? (
                              <div className="mt-2 space-y-1">
                                {libraryEntry.reasons.slice(0, 3).map((reason) => (
                                  <div key={reason.code} className="flex flex-wrap items-start gap-2">
                                    <Badge
                                      variant="outline"
                                      className={
                                        reason.severity === 'critical'
                                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                                          : reason.severity === 'warning'
                                            ? 'bg-amber-100 text-amber-900 border-amber-200'
                                            : 'bg-primary/10 text-primary border-primary/30'
                                      }
                                    >
                                      {reason.severity}
                                    </Badge>
                                    <p className="text-sm text-muted-foreground">{reason.message}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-sm text-muted-foreground">Sem insights automáticos para este criativo.</p>
                            )}
                          </div>
                          <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Resumo técnico</p>
                            <div className="mt-2 space-y-1">
                              <DetailRow label="CTR" value={formatPercent(ad.avgCtr, 2)} />
                              <DetailRow label="CPC" value={formatCurrency(cpc)} />
                              <DetailRow label="CPM" value={formatCurrency(ad.avgCpm)} />
                              <DetailRow label="Conversões" value={formatOptionalNumber(conversions)} />
                              <DetailRow label="Conv %" value={formatPercent(conversionRate)} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Configuração do anúncio</p>
                        <div className="mt-2 grid gap-3 md:grid-cols-2">
                          <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Identidade</p>
                            <div className="mt-2 space-y-1">
                              <DetailRow label="Página/Instagram" value={identityLabel} />
                              <DetailRow label="Origem" value={storyType} />
                              <DetailRow label="Snapshot" value={snapshotId ? snapshotId.slice(0, 12) : '—'} />
                            </div>
                          </div>
                          <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Formato & Destino</p>
                            <div className="mt-2 space-y-1">
                              <DetailRow label="Formato" value={`${creative?.format || '—'}${creative?.isDynamic ? ' · Dinâmico' : ''}`} />
                              <DetailRow label="CTA" value={formatCta(creative?.ctaType) || '—'} />
                              <DetailRow label="Domínio" value={domain || '—'} />
                            </div>
                          </div>
                          <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Assets</p>
                            <div className="mt-2 space-y-1">
                              <DetailRow label="Resumo" value={assetSummary} />
                              <DetailRow label="Asset feed" value={assetFeedSpec ? 'Ativo' : 'Ausente'} />
                            </div>
                          </div>
                          <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Destino</p>
                            <div className="mt-2 space-y-1">
                              <DetailRow label="URL" value={creative?.destinationUrl || '—'} />
                              <DetailRow label="WhatsApp" value={whatsappNumber ? `+${whatsappNumber}` : 'Não disponível na API'} />
                              <DetailRow label="Vídeo" value={creative?.videoId ? `ID ${creative.videoId}` : 'Sem vídeo'} />
                            </div>
                          </div>
                          <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs md:col-span-2">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Configurador de conversa</p>
                            <div className="mt-2 space-y-1">
                              <DetailRow label="Mensagem inicial" value={whatsappMessage || 'Não configurada'} />
                            </div>
                          </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Mídia do anúncio</p>
                      <div className="mt-2 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
                        <div className="relative aspect-video overflow-hidden rounded-md border border-border/60 bg-muted/20">
                          {imageUrlsForDisplay[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imageUrlsForDisplay[0]}
                              alt="Criativo"
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                              Imagem não disponível via API
                            </div>
                          )}
                          {imageUrlsForDisplay[0] ? (
                            <a
                              href={imageUrlsForDisplay[0]}
                              target="_blank"
                              rel="noreferrer"
                              className="absolute top-2 right-2 rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                            >
                              Abrir original
                            </a>
                          ) : null}
                          {imageUrlsForDisplay[0] && isThumbnailOnly ? (
                            <div className="absolute bottom-2 right-2 rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground">
                              Preview reduzido
                            </div>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {imageUrlsForDisplay.length > 1 ? (
                            imageUrlsForDisplay.slice(1, 7).map((url, idx) => (
                              <div key={`${url}-${idx}`} className="aspect-square overflow-hidden rounded-md border border-border/60 bg-muted/20">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`Criativo ${idx + 2}`} className="h-full w-full object-cover" />
                              </div>
                            ))
                          ) : (
                            <div className="col-span-3 flex h-full min-h-[120px] items-center justify-center rounded-md border border-dashed border-border/60 text-[11px] text-muted-foreground">
                              Sem variações de mídia
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {(creativeHeadline || creativeDescription || primaryText) && (
                      <div className="space-y-3">
                          {creativeHeadline && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Título</p>
                              <p className="mt-2 text-sm whitespace-pre-wrap">{creativeHeadline}</p>
                            </div>
                          )}
                          {creativeDescription && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Descrição</p>
                              <p className="mt-2 text-sm whitespace-pre-wrap">{creativeDescription}</p>
                            </div>
                          )}
                          {primaryText && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Texto principal</p>
                              <p className="mt-2 text-sm whitespace-pre-wrap">{primaryText}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {headlines.length > 1 || primaryTexts.length > 1 || descriptions.length > 1 || ctas.length > 1 || urls.length > 1 ? (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Variações do criativo</p>
                          <div className="mt-2 grid gap-4 md:grid-cols-2">
                            {headlines.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">Títulos ({headlines.length})</p>
                                <div className="mt-1 space-y-1">
                                  {headlines.slice(0, 5).map((text, idx) => (
                                    <p key={idx} className="text-sm">
                                      {text}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                            {primaryTexts.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">Textos ({primaryTexts.length})</p>
                                <div className="mt-1 space-y-1">
                                  {primaryTexts.slice(0, 5).map((text, idx) => (
                                    <p key={idx} className="text-sm">
                                      {text}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                            {descriptions.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">Descrições ({descriptions.length})</p>
                                <div className="mt-1 space-y-1">
                                  {descriptions.slice(0, 5).map((text, idx) => (
                                    <p key={idx} className="text-sm">
                                      {text}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                            {ctas.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">CTAs ({ctas.length})</p>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {ctas.slice(0, 10).map((cta, idx) => (
                                    <Badge key={idx} variant="outline">
                                      {formatCta(cta) || cta}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {urls.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">URLs ({urls.length})</p>
                                <div className="mt-1 space-y-1">
                                  {urls.slice(0, 5).map((url, idx) => (
                                    <p key={idx} className="text-sm break-all">
                                      {url}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

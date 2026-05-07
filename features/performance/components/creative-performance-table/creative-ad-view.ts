import { formatCta, formatCurrency, formatNumber, getDomainFromUrl } from '@/components/performance/creative-library/formatters';
import type { AdCreativeMetric } from '@/types';

import type { ObjectiveKey } from './columns';
import { formatCreativeType, toStringArray } from '@/components/performance/creative-performance-table/formatters';
import {
  collectCreativeImages,
  formatDestinationDomain,
  formatOptionalNumber,
  formatPercent,
  parseWelcomeMessage,
  parseWhatsAppInfo,
  withCacheBust,
  type CreativeAssetFeedSpec,
  type CreativeObjectStorySpec,
  type CreativeRawData,
} from './helpers';
import { buildCreativePyramid } from './pyramid';

export function buildCreativeAdView(ad: AdCreativeMetric, objectiveKey: ObjectiveKey, snapshotId: string | null) {
  const creative = ad.creative || null;
  const primaryText = creative?.primaryText || null;
  const objectStorySpec = (creative?.objectStorySpec ?? null) as CreativeObjectStorySpec | null;
  const assetFeedSpec = (creative?.assetFeedSpec ?? null) as CreativeAssetFeedSpec | null;
  const raw = (creative?.raw ?? null) as CreativeRawData | null;
  const derived = raw?.__derived ?? null;
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
  const descriptions = toStringArray(creative?.descriptions);
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

  return {
    creative,
    primaryText,
    objectStorySpec,
    assetFeedSpec,
    imageUrlsForDisplay,
    isThumbnailOnly,
    domain,
    destinationLabel,
    ctaLabel,
    typeLabel,
    thumbnailUrl,
    headlines,
    primaryTexts,
    descriptions,
    ctas,
    urls,
    creativeHeadline,
    creativeDescription,
    storyType,
    identityLabel,
    whatsappNumber,
    whatsappMessage,
    assetSummary,
    clicks,
    leads,
    purchases,
    conversions,
    cpc,
    conversionRate,
    conversationRate,
    metricValues,
    pyramidLayers,
  };
}

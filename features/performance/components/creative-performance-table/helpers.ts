export type CreativeObjectStorySpec = {
  video_data?: unknown;
  link_data?: {
    picture?: string | null;
  };
  photo_data?: {
    image_url?: string | null;
  };
  template_data?: unknown;
  page_id?: string | null;
  instagram_actor_id?: string | null;
  instagram_user_id?: string | null;
  child_attachments?: Array<{
    image_url?: string | null;
    picture?: string | null;
  }>;
};

export type CreativeAssetFeedSpec = {
  images?: Array<{
    url?: string | null;
    image_url?: string | null;
    imageUrl?: string | null;
  }>;
  additional_data?: {
    page_welcome_message?: string | null;
  };
};

export type DerivedCreativeData = {
  images?: {
    urls?: string[];
  };
  identity?: {
    pageName?: string | null;
    instagramUsername?: string | null;
  } | null;
  whatsapp?: {
    number?: string | null;
    prefillMessage?: string | null;
  } | null;
};

export type CreativeRawData = {
  __derived?: DerivedCreativeData;
};

export const collectCreativeImages = (params: {
  creative: {
    imageUrl?: string | null;
    thumbnailUrl?: string | null;
  } | null;
  derived?: DerivedCreativeData | null;
  assetFeedSpec?: CreativeAssetFeedSpec | null;
  objectStorySpec?: CreativeObjectStorySpec | null;
}) => {
  const urls: string[] = [];
  const pushUrl = (value?: string | null) => {
    if (!value || typeof value !== 'string') return;
    if (!urls.includes(value)) urls.push(value);
  };

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

export const formatOptionalNumber = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return value.toLocaleString('pt-BR');
};

export const formatPercent = (value: number, decimals = 1) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `${value.toFixed(decimals)}%`;
};

export const formatDestinationDomain = (domain?: string | null) => {
  if (!domain) return null;
  const normalized = domain.toLowerCase();
  if (normalized.includes('whatsapp')) return 'WhatsApp';
  if (normalized.includes('messenger')) return 'Messenger';
  if (normalized.includes('instagram')) return 'Instagram';
  if (normalized.includes('facebook')) return 'Facebook';
  return domain;
};

export const parseWhatsAppInfo = (url?: string | null) => {
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

export const parseWelcomeMessage = (assetFeedSpec: CreativeAssetFeedSpec | null): string | null => {
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

export const withCacheBust = (url: string | null | undefined, seed?: string | null) => {
  if (!url) return null;
  const token = seed && seed.length > 0 ? seed : '1';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(token)}`;
};

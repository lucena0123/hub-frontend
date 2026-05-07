import type { AdCreativeMetric } from '@/types';
import type { buildCreativeAdView } from './creative-ad-view';
import { CreativeConfigSection } from './creative-config-section';
import { CreativeCopySection } from './creative-copy-section';
import { CreativeDiagnosticsSection, type CreativeReason } from './creative-diagnostics-section';
import { CreativeMediaSection } from './creative-media-section';

type CreativeAdView = ReturnType<typeof buildCreativeAdView>;

interface CreativeExpandedDetailsProps {
  ad: AdCreativeMetric;
  libraryReasons?: CreativeReason[];
  snapshotId: string;
  view: CreativeAdView;
}

export function CreativeExpandedDetails({
  ad,
  libraryReasons,
  snapshotId,
  view,
}: CreativeExpandedDetailsProps) {
  const {
    conversionRate,
    conversions,
    cpc,
    creativeDescription,
    creativeHeadline,
    ctas,
    descriptions,
    headlines,
    imageUrlsForDisplay,
    isThumbnailOnly,
    primaryText,
    primaryTexts,
    urls,
  } = view;

  return (
    <div className="mt-5 space-y-4 rounded-md border border-border/60 bg-muted/10 p-4 text-sm">
      <CreativeDiagnosticsSection
        ad={ad}
        conversionRate={conversionRate}
        conversions={conversions}
        cpc={cpc}
        libraryReasons={libraryReasons}
      />

      <CreativeConfigSection snapshotId={snapshotId} view={view} />

      <CreativeMediaSection
        imageUrlsForDisplay={imageUrlsForDisplay}
        isThumbnailOnly={isThumbnailOnly}
      />

      <CreativeCopySection
        creativeDescription={creativeDescription}
        creativeHeadline={creativeHeadline}
        ctas={ctas}
        descriptions={descriptions}
        headlines={headlines}
        primaryText={primaryText}
        primaryTexts={primaryTexts}
        urls={urls}
      />
    </div>
  );
}

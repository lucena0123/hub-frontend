import { formatCta } from '@/components/performance/creative-library/formatters';
import type { buildCreativeAdView } from './creative-ad-view';
import { DetailRow } from './detail-row';

type CreativeAdView = ReturnType<typeof buildCreativeAdView>;

interface CreativeConfigSectionProps {
  snapshotId: string;
  view: CreativeAdView;
}

export function CreativeConfigSection({ snapshotId, view }: CreativeConfigSectionProps) {
  const {
    assetFeedSpec,
    assetSummary,
    creative,
    domain,
    identityLabel,
    storyType,
    whatsappMessage,
    whatsappNumber,
  } = view;

  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Configuração do anúncio</p>
      <div className="mt-2 grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Identidade</p>
          <div className="mt-2 space-y-1">
            <DetailRow label="Página/Instagram" value={identityLabel} />
            <DetailRow label="Origem" value={storyType} />
            <DetailRow label="Snapshot" value={snapshotId.slice(0, 12)} />
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
  );
}

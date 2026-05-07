interface CreativeMediaSectionProps {
  imageUrlsForDisplay: string[];
  isThumbnailOnly: boolean;
}

export function CreativeMediaSection({ imageUrlsForDisplay, isThumbnailOnly }: CreativeMediaSectionProps) {
  return (
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
  );
}

import { Badge } from '@/components/ui/badge';
import { formatCta } from '@/components/performance/creative-library/formatters';

interface CreativeCopySectionProps {
  creativeDescription: string | null;
  creativeHeadline: string | null;
  ctas: string[];
  descriptions: string[];
  headlines: string[];
  primaryText: string | null;
  primaryTexts: string[];
  urls: string[];
}

export function CreativeCopySection({
  creativeDescription,
  creativeHeadline,
  ctas,
  descriptions,
  headlines,
  primaryText,
  primaryTexts,
  urls,
}: CreativeCopySectionProps) {
  const hasMainCopy = Boolean(creativeHeadline || creativeDescription || primaryText);
  const hasVariations = headlines.length > 1 || primaryTexts.length > 1 || descriptions.length > 1 || ctas.length > 1 || urls.length > 1;

  return (
    <>
      {hasMainCopy && (
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

      {hasVariations ? (
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
    </>
  );
}

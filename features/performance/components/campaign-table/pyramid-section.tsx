import type { PyramidLayer } from './metric-types';

interface CampaignPyramidSectionProps {
  pyramidLayers: PyramidLayer[];
}

export function CampaignPyramidSection({ pyramidLayers }: CampaignPyramidSectionProps) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">PIRÂMIDE POR OBJETIVO</p>
      <div className="space-y-2">
        {pyramidLayers.map((layer, index) => {
          const width = 100 - index * 8;
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
  );
}

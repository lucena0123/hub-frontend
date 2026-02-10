import { Badge } from '@/components/ui/badge';

export function PromptBadge({
  promptVersion,
  promptId,
  className,
}: {
  promptVersion?: string | null;
  promptId?: string | null;
  className?: string;
}) {
  if (!promptVersion) return null;

  return (
    <Badge
      variant="outline"
      className={className ?? 'text-[10px] text-muted-foreground'}
      title={promptId ? `prompt: ${promptId}` : undefined}
    >
      {promptVersion}
    </Badge>
  );
}

'use client';

import { useOptimizationPlaybook } from './use-playbook';
import { PromptBadge } from '@/components/ui/prompt-badge';

export const PlaybookPanel = (props: { open: boolean }) => {
  const { open } = props;
  const { playbook, loading, error } = useOptimizationPlaybook(open);

  if (!open) return null;

  return (
    <div className="rounded-lg border border-orange-500/10 bg-orange-500/5 p-3 space-y-2">
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando playbook...</p>
      ) : error ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : playbook ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">
              {playbook.key} · {playbook.version}
            </p>
            <p className="text-xs text-muted-foreground">Atualizado: {playbook.updatedAt}</p>
          </div>
          <p className="text-xs text-muted-foreground">{playbook.description}</p>
          <p className="text-xs text-muted-foreground">
            Temas: {playbook.themes.length} · Regras: {playbook.rules.length}
          </p>
          {playbook.ai?.copySuggestions ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>IA Copy: {playbook.ai.copySuggestions.model}</span>
              <PromptBadge
                promptVersion={playbook.ai.copySuggestions.promptVersion}
                promptId={playbook.ai.copySuggestions.promptId}
              />
            </div>
          ) : null}
          <pre className="max-h-[420px] overflow-auto rounded-md bg-background p-3 text-xs">
            {JSON.stringify(playbook, null, 2)}
          </pre>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Sem playbook carregado.</p>
      )}
    </div>
  );
};

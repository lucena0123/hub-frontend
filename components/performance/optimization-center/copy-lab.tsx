'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { OptimizationCenterHighlight } from '@/types';
import { PromptBadge } from '@/components/ui/prompt-badge';

import { useCopyLab } from './use-copy-lab';

export const CopyLab = (props: {
  candidates: OptimizationCenterHighlight[];
  theme?: { themeKey: string; themeName: string } | null;
}) => {
  const { candidates, theme } = props;

  const {
    copyCandidates,
    selectedCopySnapshotId,
    setSelectedCopySnapshotId,
    copyInsights,
    copyInsightsLoading,
    copyGenerateLoading,
    copyError,
    generateInsights,
  } = useCopyLab({ candidates, theme });

  if (copyCandidates.length === 0) return null;

  return (
    <Card className="border-dashed border-l-4 border-l-purple-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          Sugestões de Copy (IA)
          <Badge variant="outline">Copy Lab</Badge>
        </CardTitle>
        <CardDescription>Baseado no snapshot do criativo (headline/texto/CTA). Gera variações de copy para você testar.</CardDescription>
        {copyInsights?.promptVersion ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PromptBadge promptVersion={copyInsights.promptVersion} promptId={copyInsights.promptId} />
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedCopySnapshotId ?? undefined} onValueChange={(value) => setSelectedCopySnapshotId(value)}>
            <SelectTrigger className="w-[420px]">
              <SelectValue placeholder="Selecione um criativo" />
            </SelectTrigger>
            <SelectContent>
              {copyCandidates.map((c) => (
                <SelectItem key={c.snapshotId} value={c.snapshotId}>
                  {(c.adNames?.[0] || c.headline || 'Criativo').slice(0, 80)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => generateInsights(false)} disabled={copyGenerateLoading || !selectedCopySnapshotId}>
            {copyGenerateLoading ? 'Gerando...' : 'Gerar sugestões'}
          </Button>
          <Button variant="ghost" onClick={() => generateInsights(true)} disabled={copyGenerateLoading || !selectedCopySnapshotId}>
            Regenerar
          </Button>
        </div>

        {copyInsightsLoading ? (
          <p className="text-sm text-muted-foreground">Carregando insights de copy...</p>
        ) : copyError ? (
          <p className="text-sm text-muted-foreground">{copyError}</p>
        ) : copyInsights?.analysis ? (
          <div className="space-y-3 rounded-lg border bg-background p-3">
            {copyInsights.analysis?.aiUsed === false ? (
              <div className="space-y-1">
                <p className="text-sm text-amber-700">
                  {copyInsights.errorMessage
                    ? 'IA indisponível no momento (OpenAI). Usando sugestões de fallback.'
                    : 'IA desabilitada: configure `OPENAI_API_KEY` no `backend/.env`.'}
                </p>
                {copyInsights.errorMessage ? (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer select-none">Detalhe do erro</summary>
                    <pre className="mt-2 max-h-[160px] overflow-auto whitespace-pre-wrap rounded-md bg-muted/40 p-2">
                      {String(copyInsights.errorMessage).slice(0, 1000)}
                    </pre>
                  </details>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {copyInsights.analysis?.angle?.name ? (
                <Badge variant="secondary">ângulo: {copyInsights.analysis.angle.name}</Badge>
              ) : null}
              {copyInsights.analysis?.persona ? (
                <Badge variant="outline">persona: {String(copyInsights.analysis.persona).slice(0, 48)}</Badge>
              ) : null}
            </div>

            {copyInsights.analysis?.hook ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Hook</p>
                <p className="text-sm">{copyInsights.analysis.hook}</p>
              </div>
            ) : null}

            {Array.isArray(copyInsights.analysis?.clarityIssues) && copyInsights.analysis.clarityIssues.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Problemas de clareza</p>
                <ul className="list-disc pl-5 text-sm">
                  {copyInsights.analysis.clarityIssues.slice(0, 5).map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {Array.isArray(copyInsights.analysis?.complianceRisks) && copyInsights.analysis.complianceRisks.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Cuidados (compliance)</p>
                <ul className="list-disc pl-5 text-sm">
                  {copyInsights.analysis.complianceRisks.slice(0, 5).map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {Array.isArray(copyInsights.analysis?.suggestions?.headlines) &&
              copyInsights.analysis.suggestions.headlines.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Headlines sugeridas</p>
                <ul className="list-disc pl-5 text-sm">
                  {copyInsights.analysis.suggestions.headlines.slice(0, 8).map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {Array.isArray(copyInsights.analysis?.suggestions?.primaryTexts) &&
              copyInsights.analysis.suggestions.primaryTexts.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Textos (WhatsApp) sugeridos</p>
                <ul className="list-disc pl-5 text-sm">
                  {copyInsights.analysis.suggestions.primaryTexts.slice(0, 6).map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {Array.isArray(copyInsights.analysis?.suggestions?.ctas) && copyInsights.analysis.suggestions.ctas.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">CTAs sugeridos</p>
                <div className="flex flex-wrap gap-2">
                  {copyInsights.analysis.suggestions.ctas.slice(0, 6).map((item: string, idx: number) => (
                    <Badge key={idx} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {Array.isArray(copyInsights.analysis?.suggestions?.experiments) &&
              copyInsights.analysis.suggestions.experiments.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Testes sugeridos</p>
                <ul className="list-disc pl-5 text-sm">
                  {copyInsights.analysis.suggestions.experiments.slice(0, 4).map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sem insights ainda. Clique em “Gerar sugestões”.</p>
        )}
      </CardContent>
    </Card>
  );
};

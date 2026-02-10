'use client';

import { useState } from 'react';
import { Copy, Check, Loader2, Sparkles, Zap, AlertTriangle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { generateCopySuggestions, validateCreativeCopy, type CopySuggestion, type CopyValidationResult } from '@/lib/api/client';
import { PromptBadge } from '@/components/ui/prompt-badge';

const THEME_OPTIONS = [
  { value: '', label: 'Detectar automaticamente' },
  { value: 'trabalhista', label: 'Direito Trabalhista' },
  { value: 'passageiro_aereo', label: 'Direito do Passageiro Aéreo' },
  { value: 'salario_maternidade', label: 'Salário Maternidade' },
  { value: 'geral', label: 'Geral' },
];

const ANGLE_COLORS: Record<string, string> = {
  dor: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  urgência: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  'prova social': 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  benefício: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  autoridade: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
  curiosidade: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400',
  informativo: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

function SuggestionCard({ suggestion, index }: { suggestion: CopySuggestion & { linterScore?: number | null }; index: number }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {}
  };

  const angleColor = ANGLE_COLORS[suggestion.angle?.toLowerCase()] || ANGLE_COLORS.informativo;

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
            <Badge className={`text-[10px] ${angleColor}`}>{suggestion.angle}</Badge>
            <Badge variant="outline" className="text-[10px]">{suggestion.cta}</Badge>
          </div>
          {suggestion.linterScore != null && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              suggestion.linterScore >= 80
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                : suggestion.linterScore >= 50
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
            }`}>
              {suggestion.linterScore}/100
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Headline</span>
            <button
              onClick={() => handleCopy(suggestion.headline, 'headline')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {copiedField === 'headline' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
          <p className="text-sm font-medium">{suggestion.headline}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Texto Principal</span>
            <button
              onClick={() => handleCopy(suggestion.primaryText, 'primaryText')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {copiedField === 'primaryText' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
          <p className="text-sm text-muted-foreground">{suggestion.primaryText}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function CopyGenerator({ clientId }: { clientId: string }) {
  const [themeKey, setThemeKey] = useState('');
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<(CopySuggestion & { linterScore?: number | null })[]>([]);
  const [aiUsed, setAiUsed] = useState(false);
  const [winnerContext, setWinnerContext] = useState<{ count: number; avgCpl: number | null } | null>(null);
  const [promptMeta, setPromptMeta] = useState<{ id: string | null; version: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setSuggestions([]);
    setAiUsed(false);
    setWinnerContext(null);
    setPromptMeta(null);

    try {
      const res = await generateCopySuggestions(clientId, {
        themeKey: themeKey || undefined,
        count: 5,
      });

      setAiUsed(res.aiUsed);
      setWinnerContext(res.winnerContext);
      setPromptMeta({ id: res.promptId ?? null, version: res.promptVersion ?? null });

      // Validate each suggestion with the linter in parallel
      const withScores = await Promise.all(
        res.suggestions.map(async (s) => {
          try {
            const lint = await validateCreativeCopy({
              headline: s.headline,
              primaryText: s.primaryText,
              ctaType: s.cta,
              themeKey: res.themeKey,
            });
            return { ...s, linterScore: lint.score };
          } catch {
            return { ...s, linterScore: null };
          }
        })
      );

      setSuggestions(withScores.sort((a, b) => (b.linterScore ?? 0) - (a.linterScore ?? 0)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar sugestões');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Gerador de Copy com IA</CardTitle>
            </div>
            <PromptBadge promptVersion={promptMeta?.version} promptId={promptMeta?.id} />
          </div>
          <CardDescription>
            Gere novas variações de copy baseadas nos seus melhores criativos (winners).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="space-y-1.5 flex-1">
              <label className="text-xs font-medium text-muted-foreground">Tema</label>
              <select
                value={themeKey}
                onChange={(e) => setThemeKey(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {THEME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              Gerar Copies
            </Button>
          </div>

          {winnerContext && (
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span>Baseado em <strong>{winnerContext.count}</strong> winners</span>
              {winnerContext.avgCpl != null && (
                <span>CPL médio: <strong>R$ {winnerContext.avgCpl.toFixed(2)}</strong></span>
              )}
              {aiUsed ? (
                <Badge variant="outline" className="text-[10px] bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400">
                  IA (OpenAI)
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">Templates</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-3 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {suggestions.map((s, i) => (
            <SuggestionCard key={i} suggestion={s} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

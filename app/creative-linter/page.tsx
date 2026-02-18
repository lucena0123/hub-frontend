'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle, Info, Loader2, FileWarning, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { validateCreativeCopy, type CopyValidationResult } from '@/lib/api/client';
import { PageShell } from '@/components/layout/page-shell';

const CTA_OPTIONS = [
  { value: '', label: 'Nenhum (não especificado)' },
  { value: 'WHATSAPP_MESSAGE', label: 'WhatsApp Message' },
  { value: 'SEND_MESSAGE', label: 'Send Message' },
  { value: 'LEARN_MORE', label: 'Learn More' },
  { value: 'SIGN_UP', label: 'Sign Up' },
  { value: 'CONTACT_US', label: 'Contact Us' },
  { value: 'CALL_NOW', label: 'Call Now' },
  { value: 'APPLY_NOW', label: 'Apply Now' },
];

const THEME_OPTIONS = [
  { value: '', label: 'Nenhum (não especificado)' },
  { value: 'trabalhista', label: 'Direito Trabalhista' },
  { value: 'passageiro_aereo', label: 'Direito do Passageiro Aéreo' },
  { value: 'salario_maternidade', label: 'Salário Maternidade' },
  { value: 'geral', label: 'Geral' },
];

const severityIcon = {
  error: <AlertTriangle className="h-4 w-4 text-red-500" />,
  warning: <FileWarning className="h-4 w-4 text-amber-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
};

const severityBg = {
  error: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30',
  warning: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30',
  info: 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30',
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
      : score >= 50
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
        : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400';

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-lg font-bold ${color}`}>
      {score}/100
    </span>
  );
}

export default function CreativeLinterPage() {
  const [headline, setHeadline] = useState('');
  const [primaryText, setPrimaryText] = useState('');
  const [description, setDescription] = useState('');
  const [ctaType, setCtaType] = useState('');
  const [themeKey, setThemeKey] = useState('');
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<CopyValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async () => {
    setValidating(true);
    setResult(null);
    setError(null);
    try {
      const res = await validateCreativeCopy({
        headline: headline || undefined,
        primaryText: primaryText || undefined,
        description: description || undefined,
        ctaType: ctaType || undefined,
        themeKey: themeKey || undefined,
      });
      setResult(res);
    } catch (err: unknown) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Falha ao validar copy.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <PageShell
      eyebrow="Ferramentas"
      title="Creative Linter"
      description="Valide o copy antes de publicar no Meta Ads."
    >
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Checklist do Criativo</h2>
            <p className="text-sm text-muted-foreground">
              Padronize headlines, CTA e coerência do texto.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Copy do Criativo</CardTitle>
            <CardDescription>
              Preencha os campos e clique em validar para verificar possíveis problemas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="headline">Headline</Label>
                <span className="text-xs text-muted-foreground">{headline.length}/60</span>
              </div>
              <Input
                id="headline"
                placeholder="Ex: Seus direitos trabalhistas podem estar sendo violados"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className={headline.length > 60 ? 'border-amber-500' : ''}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="primaryText">Texto Principal</Label>
                <span className="text-xs text-muted-foreground">{primaryText.length}/500</span>
              </div>
              <Textarea
                id="primaryText"
                placeholder="O texto do corpo do seu anúncio..."
                value={primaryText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrimaryText(e.target.value)}
                rows={5}
                className={primaryText.length > 500 ? 'border-amber-500' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input
                id="description"
                placeholder="Descrição do link (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ctaType">CTA</Label>
                <select
                  id="ctaType"
                  value={ctaType}
                  onChange={(e) => setCtaType(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {CTA_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="themeKey">Tema</Label>
                <select
                  id="themeKey"
                  value={themeKey}
                  onChange={(e) => setThemeKey(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {THEME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button onClick={handleValidate} disabled={validating} className="w-full">
              {validating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Validar Copy
            </Button>
            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {result.valid ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  Resultado
                </CardTitle>
                <ScoreBadge score={result.score} />
              </div>
              <CardDescription>
                {result.summary.errors} erros, {result.summary.warnings} avisos, {result.summary.info} informações
                {result.theme && (
                  <> &middot; Tema: <Badge variant="outline" className="text-xs ml-1">{result.theme.themeName}</Badge></>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.issues.length === 0 ? (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Nenhum problema encontrado. Seu copy está pronto!
                </div>
              ) : (
                result.issues.map((issue, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-3 space-y-1 ${severityBg[issue.severity]}`}
                  >
                    <div className="flex items-center gap-2">
                      {severityIcon[issue.severity]}
                      <span className="text-sm font-medium">{issue.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">{issue.message}</p>
                    {issue.suggestion && (
                      <p className="text-xs pl-6 italic">{issue.suggestion}</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}

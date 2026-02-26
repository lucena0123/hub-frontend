'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormMeta {
  leadId: string;
  nomeEscritorio: string;
  responsavel: string;
  alreadySubmitted: boolean;
  submittedAt: string | null;
}

interface BriefingPayload {
  areaPrincipal: string;
  outrasAreas: string;
  numeroAdvogados: string;
  casosMes: string;
  ticketMedio: string;
  faturamentoMensal: string;
  investimentoMarketing: string;
  canaisAtivos: string[];
  principalDor: string;
  objetivo: string;
  concorrentes: string;
  diferenciais: string;
  observacoes: string;
}

const EMPTY_PAYLOAD: BriefingPayload = {
  areaPrincipal: '',
  outrasAreas: '',
  numeroAdvogados: '',
  casosMes: '',
  ticketMedio: '',
  faturamentoMensal: '',
  investimentoMarketing: '',
  canaisAtivos: [],
  principalDor: '',
  objetivo: '',
  concorrentes: '',
  diferenciais: '',
  observacoes: '',
};

const AREAS = [
  'Trabalhista',
  'Aéreo (atraso/cancelamento)',
  'Salário maternidade',
  'Previdenciário',
  'Consumidor',
  'Família e Sucessões',
  'Imobiliário',
  'Criminal',
  'Outro',
];

const CANAIS = [
  'Instagram',
  'Google Ads',
  'Indicação',
  'Site orgânico',
  'WhatsApp',
  'TikTok',
  'Facebook',
  'LinkedIn',
  'Nenhum',
];

const DORES = [
  'Captação de novos clientes',
  'Qualidade dos leads (muito frio/sem perfil)',
  'Custo por aquisição alto',
  'Conversão baixa no funil',
  'Presença fraca nas redes sociais',
  'Dependência de indicação',
  'Falta de processos de vendas',
  'Outro',
];

const OBJETIVOS = [
  'Aumentar volume de casos novos por mês',
  'Reduzir custo de aquisição de clientes',
  'Melhorar presença digital e autoridade',
  'Estruturar processo comercial',
  'Expandir para nova área do direito',
  'Outro',
];

// ---------------------------------------------------------------------------
// API calls (direto para o backend, sem cookie de sessão)
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchFormMeta(token: string, leadId: string): Promise<FormMeta> {
  const res = await fetch(
    `${API_BASE}/api/public/forms/meta?token=${encodeURIComponent(token)}&leadId=${encodeURIComponent(leadId)}`,
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Link inválido ou expirado.');
  return data as FormMeta;
}

async function submitBriefing(
  token: string,
  leadId: string,
  payload: BriefingPayload,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/public/forms/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, leadId, formType: 'briefing', payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Falha ao enviar formulário.');
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-3 mt-6 first:mt-0">
      {children}
    </h2>
  );
}

function FieldLabel({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-zinc-700 mb-1">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function Select({
  id,
  value,
  onChange,
  children,
  required,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
    >
      <option value="">Selecionar...</option>
      {children}
    </select>
  );
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
    />
  );
}

function CheckGroup({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            selected.includes(opt)
              ? 'border-zinc-800 bg-zinc-800 text-white'
              : 'border-zinc-300 bg-white text-zinc-600 hover:border-zinc-500'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function BriefingFormPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const leadId = searchParams.get('leadId') ?? '';

  const [meta, setMeta] = useState<FormMeta | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<BriefingPayload>(EMPTY_PAYLOAD);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const set = (key: keyof BriefingPayload) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Load form meta
  useEffect(() => {
    if (!token || !leadId) {
      setLoadError('Link incompleto. Solicite um novo link ao responsável.');
      setLoading(false);
      return;
    }

    fetchFormMeta(token, leadId)
      .then((data) => {
        setMeta(data);
        if (data.alreadySubmitted) setSubmitted(true);
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [token, leadId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      await submitBriefing(token, leadId, form);
      setSubmitted(true);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao enviar formulário.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // States
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
        <AlertTriangle className="mb-4 h-10 w-10 text-amber-500" />
        <h1 className="text-lg font-semibold text-zinc-800">Link inválido</h1>
        <p className="mt-2 text-sm text-zinc-500 text-center max-w-sm">{loadError}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-zinc-100 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
          <h1 className="text-xl font-semibold text-zinc-800">Briefing enviado!</h1>
          <p className="mt-3 text-sm text-zinc-500">
            Obrigado, <strong>{meta?.nomeEscritorio}</strong>. Recebemos suas informações e
            entraremos em contato em breve para discutir a estratégia.
          </p>
          {meta?.submittedAt && (
            <p className="mt-4 text-xs text-zinc-400">
              Enviado em {new Date(meta.submittedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-4">
      <div className="mx-auto w-full max-w-lg">

        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">Formulário de Briefing</p>
          <h1 className="text-2xl font-bold text-zinc-900">{meta?.nomeEscritorio}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Preencha as informações abaixo para que possamos personalizar a estratégia do seu escritório.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  s === step
                    ? 'bg-zinc-900 text-white'
                    : s < step
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-200 text-zinc-500'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s < totalSteps && <div className={`h-px w-8 ${s < step ? 'bg-emerald-400' : 'bg-zinc-200'}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm p-6">

            {/* ---- STEP 1: Estrutura do Escritório ---- */}
            {step === 1 && (
              <div className="space-y-4">
                <SectionTitle>Estrutura do Escritório</SectionTitle>

                <div>
                  <FieldLabel htmlFor="areaPrincipal" required>Área principal de atuação</FieldLabel>
                  <Select id="areaPrincipal" value={form.areaPrincipal} onChange={set('areaPrincipal')} required>
                    {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </Select>
                </div>

                <div>
                  <FieldLabel htmlFor="outrasAreas">Outras áreas (se houver)</FieldLabel>
                  <TextInput
                    id="outrasAreas"
                    value={form.outrasAreas}
                    onChange={set('outrasAreas')}
                    placeholder="Ex: Consumidor, Previdenciário..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="numeroAdvogados" required>Nº de advogados</FieldLabel>
                    <TextInput
                      id="numeroAdvogados"
                      type="number"
                      value={form.numeroAdvogados}
                      onChange={set('numeroAdvogados')}
                      placeholder="Ex: 5"
                      required
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="casosMes" required>Casos novos/mês</FieldLabel>
                    <TextInput
                      id="casosMes"
                      type="number"
                      value={form.casosMes}
                      onChange={set('casosMes')}
                      placeholder="Ex: 30"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="ticketMedio">Ticket médio (R$)</FieldLabel>
                    <TextInput
                      id="ticketMedio"
                      type="number"
                      value={form.ticketMedio}
                      onChange={set('ticketMedio')}
                      placeholder="Ex: 2500"
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="faturamentoMensal">Faturamento mensal (R$)</FieldLabel>
                    <TextInput
                      id="faturamentoMensal"
                      type="number"
                      value={form.faturamentoMensal}
                      onChange={set('faturamentoMensal')}
                      placeholder="Ex: 80000"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ---- STEP 2: Marketing Atual ---- */}
            {step === 2 && (
              <div className="space-y-4">
                <SectionTitle>Marketing Atual</SectionTitle>

                <div>
                  <FieldLabel htmlFor="investimentoMarketing">Investimento mensal em marketing (R$)</FieldLabel>
                  <TextInput
                    id="investimentoMarketing"
                    type="number"
                    value={form.investimentoMarketing}
                    onChange={set('investimentoMarketing')}
                    placeholder="Ex: 3000"
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="canaisAtivos">Canais utilizados atualmente</FieldLabel>
                  <CheckGroup
                    options={CANAIS}
                    selected={form.canaisAtivos}
                    onChange={(v) => setForm((prev) => ({ ...prev, canaisAtivos: v }))}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="concorrentes">Principais concorrentes ou referências</FieldLabel>
                  <TextInput
                    id="concorrentes"
                    value={form.concorrentes}
                    onChange={set('concorrentes')}
                    placeholder="Ex: Escritório Silva, Advocacia Lopes..."
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="diferenciais">O que diferencia o seu escritório?</FieldLabel>
                  <textarea
                    id="diferenciais"
                    value={form.diferenciais}
                    onChange={(e) => set('diferenciais')(e.target.value)}
                    rows={3}
                    placeholder="Ex: Atendimento 100% digital, taxa de aprovação de 90%, equipe especializada..."
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none"
                  />
                </div>
              </div>
            )}

            {/* ---- STEP 3: Objetivos e Dores ---- */}
            {step === 3 && (
              <div className="space-y-4">
                <SectionTitle>Objetivos e Desafios</SectionTitle>

                <div>
                  <FieldLabel htmlFor="principalDor" required>Principal desafio hoje</FieldLabel>
                  <Select id="principalDor" value={form.principalDor} onChange={set('principalDor')} required>
                    {DORES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </Select>
                </div>

                <div>
                  <FieldLabel htmlFor="objetivo" required>Objetivo principal com o projeto</FieldLabel>
                  <Select id="objetivo" value={form.objetivo} onChange={set('objetivo')} required>
                    {OBJETIVOS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </Select>
                </div>

                <div>
                  <FieldLabel htmlFor="observacoes">Alguma informação adicional?</FieldLabel>
                  <textarea
                    id="observacoes"
                    value={form.observacoes}
                    onChange={(e) => set('observacoes')(e.target.value)}
                    rows={4}
                    placeholder="Conte mais sobre seu escritório, metas, histórico com outras agências, etc."
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none"
                  />
                </div>

                {submitError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    {submitError}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-5 flex justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}
                className="flex-1 rounded-xl border border-zinc-300 bg-white py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Voltar
              </button>
            ) : (
              <div className="flex-1" />
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && (!form.areaPrincipal || !form.numeroAdvogados || !form.casosMes)) {
                    return;
                  }
                  setStep((prev) => (prev + 1) as 1 | 2 | 3);
                }}
                disabled={step === 1 && (!form.areaPrincipal || !form.numeroAdvogados || !form.casosMes)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting || !form.principalDor || !form.objetivo}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar briefing'
                )}
              </button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Suas informações são tratadas com confidencialidade e usadas somente para preparar a estratégia do seu escritório.
        </p>
      </div>
    </div>
  );
}

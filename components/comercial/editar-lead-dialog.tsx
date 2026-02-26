'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CommercialAreaPrincipal,
  CommercialLead,
  updateCommercialLead,
} from '@/lib/api/client/commercial';

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;
    const msg =
      e?.response && typeof e.response === 'object'
        ? (e.response as Record<string, unknown>)?.data
        : undefined;
    if (typeof msg === 'string') return msg;
    if (
      typeof msg === 'object' &&
      msg !== null &&
      typeof (msg as Record<string, unknown>).message === 'string'
    ) {
      return (msg as Record<string, unknown>).message as string;
    }
  }
  return fallback;
}

interface EditarLeadDialogProps {
  lead: CommercialLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (lead: CommercialLead) => void;
}

const INPUT_CLS =
  'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';
const SELECT_CLS =
  'h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring';
const LABEL_CLS = 'text-xs text-muted-foreground mb-1 block';

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasília / SP / RJ (UTC-3)' },
  { value: 'America/Fortaleza', label: 'Fortaleza / CE (UTC-3)' },
  { value: 'America/Recife', label: 'Recife / PE (UTC-3)' },
  { value: 'America/Belem', label: 'Belém / PA (UTC-3)' },
  { value: 'America/Manaus', label: 'Manaus / AM (UTC-4)' },
  { value: 'America/Cuiaba', label: 'Cuiabá / MT (UTC-4)' },
  { value: 'America/Porto_Velho', label: 'Porto Velho / RO (UTC-4)' },
];

const AREAS: { value: CommercialAreaPrincipal; label: string }[] = [
  { value: 'trabalhista', label: 'Trabalhista' },
  { value: 'aereo', label: 'Aéreo' },
  { value: 'salario_maternidade', label: 'Salário Maternidade' },
  { value: 'previdenciario', label: 'Previdenciário' },
  { value: 'outro', label: 'Outro' },
];

export function EditarLeadDialog({
  lead,
  open,
  onOpenChange,
  onUpdated,
}: EditarLeadDialogProps) {
  // Contato
  const [nomeContato, setNomeContato] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [cidade, setCidade] = useState('');

  // Qualificação
  const [areaPrincipal, setAreaPrincipal] = useState<CommercialAreaPrincipal | ''>('');
  const [qtdAdvogados, setQtdAdvogados] = useState('');
  const [faturamentoEstimado, setFaturamentoEstimado] = useState('');
  const [orcamentoMarketing, setOrcamentoMarketing] = useState('');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');

  // Proposta
  const [valProposta, setValProposta] = useState('');
  const [urlProposta, setUrlProposta] = useState('');
  const [scoreQualificacao, setScoreQualificacao] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preenche os campos sempre que o lead mudar
  useEffect(() => {
    if (!lead) return;
    setNomeContato(lead.nomeContato ?? '');
    setWhatsapp(lead.whatsapp ?? '');
    setEmail(lead.email ?? '');
    setInstagram(lead.instagram ?? '');
    setCidade(lead.cidade ?? '');
    setAreaPrincipal((lead.areaPrincipal as CommercialAreaPrincipal) ?? '');
    setQtdAdvogados(lead.qtdAdvogados != null ? String(lead.qtdAdvogados) : '');
    setFaturamentoEstimado(lead.faturamentoEstimado != null ? String(lead.faturamentoEstimado) : '');
    setOrcamentoMarketing(lead.orcamentoMarketing != null ? String(lead.orcamentoMarketing) : '');
    setTimezone(lead.timezone ?? 'America/Sao_Paulo');
    setValProposta(lead.valProposta != null ? String(lead.valProposta) : '');
    setUrlProposta(lead.urlProposta ?? '');
    setScoreQualificacao(lead.scoreQualificacao != null ? String(lead.scoreQualificacao) : '');
    setError(null);
  }, [lead]);

  const handleSubmit = async () => {
    if (!lead) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateCommercialLead(lead.leadId, {
        nomeContato: nomeContato.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        email: email.trim() || undefined,
        instagram: instagram.trim() || undefined,
        cidade: cidade.trim() || undefined,
        areaPrincipal: areaPrincipal || undefined,
        qtdAdvogados: qtdAdvogados ? Number(qtdAdvogados) : undefined,
        faturamentoEstimado: faturamentoEstimado ? Number(faturamentoEstimado) : undefined,
        orcamentoMarketing: orcamentoMarketing ? Number(orcamentoMarketing) : undefined,
        timezone,
        valProposta: valProposta ? Number(valProposta) : undefined,
        urlProposta: urlProposta.trim() || undefined,
        scoreQualificacao: scoreQualificacao ? Number(scoreQualificacao) : undefined,
      });
      onUpdated(updated);
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao atualizar lead.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Editar lead
            {lead && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                — {lead.nomeEscritorio}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* ── Contato ── */}
          <section className="space-y-3">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
              Contato
            </p>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className={LABEL_CLS}>Contato (pessoa)</label>
                <input
                  className={INPUT_CLS}
                  placeholder="Dr(a). Nome Sobrenome"
                  value={nomeContato}
                  onChange={(e) => setNomeContato(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLS}>WhatsApp</label>
                  <input
                    className={INPUT_CLS}
                    placeholder="5585999999999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>E-mail</label>
                  <input
                    className={INPUT_CLS}
                    type="email"
                    placeholder="contato@escritorio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Instagram</label>
                  <input
                    className={INPUT_CLS}
                    placeholder="@handle"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Cidade</label>
                  <input
                    className={INPUT_CLS}
                    placeholder="Fortaleza"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── Qualificação ── */}
          <section className="space-y-3">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
              Qualificação
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>Área principal</label>
                <select
                  className={SELECT_CLS}
                  value={areaPrincipal}
                  onChange={(e) =>
                    setAreaPrincipal(e.target.value as CommercialAreaPrincipal | '')
                  }
                >
                  <option value="">Não informada</option>
                  {AREAS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Nº de advogados</label>
                <input
                  className={INPUT_CLS}
                  type="number"
                  min="1"
                  placeholder="Ex.: 5"
                  value={qtdAdvogados}
                  onChange={(e) => setQtdAdvogados(e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Faturamento est. (R$/mês)</label>
                <input
                  className={INPUT_CLS}
                  type="number"
                  min="0"
                  placeholder="Ex.: 50000"
                  value={faturamentoEstimado}
                  onChange={(e) => setFaturamentoEstimado(e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Budget marketing (R$/mês)</label>
                <input
                  className={INPUT_CLS}
                  type="number"
                  min="0"
                  placeholder="Ex.: 3000"
                  value={orcamentoMarketing}
                  onChange={(e) => setOrcamentoMarketing(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className={LABEL_CLS}>Fuso horário</label>
                <select
                  className={SELECT_CLS}
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* ── Proposta ── */}
          <section className="space-y-3">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
              Proposta
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>Valor da proposta (R$)</label>
                <input
                  className={INPUT_CLS}
                  type="number"
                  min="0"
                  placeholder="Ex.: 4500"
                  value={valProposta}
                  onChange={(e) => setValProposta(e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Score de qualificação (0–100)</label>
                <input
                  className={INPUT_CLS}
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Ex.: 75"
                  value={scoreQualificacao}
                  onChange={(e) => setScoreQualificacao(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className={LABEL_CLS}>URL da proposta</label>
                <input
                  className={INPUT_CLS}
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={urlProposta}
                  onChange={(e) => setUrlProposta(e.target.value)}
                />
              </div>
            </div>
          </section>
        </div>

        {error && <p className="text-xs text-destructive mt-1">{error}</p>}

        <DialogFooter>
          <button
            className="h-9 px-4 rounded-md border border-input bg-transparent text-sm hover:bg-accent"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            disabled={saving}
            onClick={handleSubmit}
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

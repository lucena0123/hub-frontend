'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { CommercialAreaPrincipal, CommercialLead, createCommercialLead } from '@/lib/api/client/commercial';

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;
    const msg = e?.response && typeof e.response === 'object'
      ? (e.response as Record<string, unknown>)?.data
      : undefined;
    if (typeof msg === 'string') return msg;
    if (typeof msg === 'object' && msg !== null && typeof (msg as Record<string, unknown>).message === 'string') {
      return (msg as Record<string, unknown>).message as string;
    }
  }
  return fallback;
}

interface NovoLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (lead: CommercialLead) => void;
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

export function NovoLeadDialog({ open, onOpenChange, onCreated }: NovoLeadDialogProps) {
  // Identificação
  const [nomeEscritorio, setNomeEscritorio] = useState('');
  const [nomeContato, setNomeContato] = useState('');
  const [responsavel, setResponsavel] = useState('Matheus');
  const [origem, setOrigem] = useState<'instagram' | 'indicacao' | 'site' | 'whatsapp' | 'outro'>('instagram');

  // Contato
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

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setNomeEscritorio('');
    setNomeContato('');
    setResponsavel('Matheus');
    setOrigem('instagram');
    setWhatsapp('');
    setEmail('');
    setInstagram('');
    setCidade('');
    setAreaPrincipal('');
    setQtdAdvogados('');
    setFaturamentoEstimado('');
    setOrcamentoMarketing('');
    setTimezone('America/Sao_Paulo');
    setError(null);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  const handleSubmit = async () => {
    if (!nomeEscritorio.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const lead = await createCommercialLead({
        nomeEscritorio: nomeEscritorio.trim(),
        nomeContato: nomeContato.trim() || undefined,
        responsavel: responsavel.trim(),
        origem,
        whatsapp: whatsapp.trim() || undefined,
        email: email.trim() || undefined,
        instagram: instagram.trim() || undefined,
        cidade: cidade.trim() || undefined,
        areaPrincipal: areaPrincipal || undefined,
        qtdAdvogados: qtdAdvogados ? Number(qtdAdvogados) : undefined,
        faturamentoEstimado: faturamentoEstimado ? Number(faturamentoEstimado) : undefined,
        orcamentoMarketing: orcamentoMarketing ? Number(orcamentoMarketing) : undefined,
        timezone,
      });
      onCreated(lead);
      handleOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao criar lead.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* ── Identificação ── */}
          <section className="space-y-3">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Identificação</p>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className={LABEL_CLS}>Escritório <span className="text-destructive">*</span></label>
                <input
                  className={INPUT_CLS}
                  placeholder="Ex.: Escritório Exemplo Advocacia"
                  value={nomeEscritorio}
                  onChange={(e) => setNomeEscritorio(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Contato (pessoa)</label>
                <input
                  className={INPUT_CLS}
                  placeholder="Dr(a). Nome Sobrenome"
                  value={nomeContato}
                  onChange={(e) => setNomeContato(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLS}>Responsável</label>
                  <input
                    className={INPUT_CLS}
                    placeholder="Matheus"
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Origem</label>
                  <select className={SELECT_CLS} value={origem} onChange={(e) => setOrigem(e.target.value as typeof origem)}>
                    <option value="instagram">Instagram</option>
                    <option value="indicacao">Indicação</option>
                    <option value="site">Site</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* ── Contato ── */}
          <section className="space-y-3">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Contato</p>
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
          </section>

          {/* ── Qualificação (colapsável) ── */}
          <details className="group">
            <summary className="cursor-pointer text-[11px] uppercase tracking-widest text-muted-foreground font-medium select-none list-none flex items-center gap-1">
              <span className="transition-transform group-open:rotate-90">▶</span> Qualificação
            </summary>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLS}>Área principal</label>
                  <select
                    className={SELECT_CLS}
                    value={areaPrincipal}
                    onChange={(e) => setAreaPrincipal(e.target.value as CommercialAreaPrincipal | '')}
                  >
                    <option value="">Selecionar...</option>
                    {AREAS.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
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
              </div>
              <div>
                <label className={LABEL_CLS}>Fuso horário</label>
                <select className={SELECT_CLS} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </details>
        </div>

        {error && <p className="text-xs text-destructive mt-1">{error}</p>}

        <DialogFooter>
          <button
            className="h-9 px-4 rounded-md border border-input bg-transparent text-sm hover:bg-accent"
            onClick={() => handleOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            disabled={!nomeEscritorio.trim() || saving}
            onClick={handleSubmit}
          >
            {saving ? 'Salvando...' : 'Criar lead'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

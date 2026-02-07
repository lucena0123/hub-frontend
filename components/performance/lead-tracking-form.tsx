'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { upsertLeadTracking } from '@/lib/api/client';

interface LeadTrackingFormProps {
  campaignId: string;
  campaignName: string;
  onSuccess?: () => void;
}

const DISQUALIFICATION_PRESETS: Array<{ key: string; label: string }> = [
  { key: 'curioso', label: 'Curioso / sem intenção' },
  { key: 'fora_tema', label: 'Fora do tema' },
  { key: 'sem_perfil', label: 'Sem perfil (não se encaixa)' },
  { key: 'sem_verba', label: 'Sem verba' },
  { key: 'ja_tem_advogado', label: 'Já tem advogado / já resolveu' },
  { key: 'nao_respondeu', label: 'Não respondeu' },
  { key: 'outros', label: 'Outros' },
];

export function LeadTrackingForm({ campaignId, campaignName, onSuccess }: LeadTrackingFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    qualifiedLeads: 0,
    disqualificationReasons: Object.fromEntries(DISQUALIFICATION_PRESETS.map((preset) => [preset.key, 0])) as Record<string, number>,
    contractsClosed: 0,
    averageTicket: 0,
    revenueGenerated: 0,
    leadsResponded: 0,
    responseTimeHours: 0,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanedReasonsEntries = Object.entries(formData.disqualificationReasons || {}).filter(
        ([, count]) => (Number.isFinite(count) ? count : 0) > 0
      );
      const cleanedReasons =
        cleanedReasonsEntries.length > 0 ? Object.fromEntries(cleanedReasonsEntries) : undefined;

      await upsertLeadTracking({
        campaignId,
        ...formData,
        disqualificationReasons: cleanedReasons,
        responseTimeHours: formData.responseTimeHours > 0 ? formData.responseTimeHours : null,
        notes: formData.notes || null,
      });
      alert('Dados salvos com sucesso!');
      if (onSuccess) onSuccess();
    } catch (error) {
      alert('Erro ao salvar dados: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-l-4 border-l-lime-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Tracking Manual do Funil</CardTitle>
        <CardDescription>
          Adicione dados de qualificação e fechamento para {campaignName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="qualifiedLeads">Leads Qualificados</Label>
              <Input
                id="qualifiedLeads"
                type="number"
                min="0"
                value={formData.qualifiedLeads}
                onChange={(e) =>
                  setFormData({ ...formData, qualifiedLeads: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div className="col-span-2">
              <Label>Motivos de Desqualificação (opcional)</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Preencha apenas os motivos que fizeram as pessoas não avançarem (não precisa fechar 100% com o total).
              </p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {DISQUALIFICATION_PRESETS.map((preset) => (
                  <div key={preset.key}>
                    <Label htmlFor={`reason-${preset.key}`} className="text-xs">
                      {preset.label}
                    </Label>
                    <Input
                      id={`reason-${preset.key}`}
                      type="number"
                      min="0"
                      value={formData.disqualificationReasons[preset.key] ?? 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          disqualificationReasons: {
                            ...formData.disqualificationReasons,
                            [preset.key]: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="contractsClosed">Contratos Fechados</Label>
              <Input
                id="contractsClosed"
                type="number"
                min="0"
                value={formData.contractsClosed}
                onChange={(e) =>
                  setFormData({ ...formData, contractsClosed: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div>
              <Label htmlFor="averageTicket">Ticket Médio (R$)</Label>
              <Input
                id="averageTicket"
                type="number"
                min="0"
                step="0.01"
                value={formData.averageTicket}
                onChange={(e) =>
                  setFormData({ ...formData, averageTicket: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div>
              <Label htmlFor="revenueGenerated">Receita Gerada (R$)</Label>
              <Input
                id="revenueGenerated"
                type="number"
                min="0"
                step="0.01"
                value={formData.revenueGenerated}
                onChange={(e) =>
                  setFormData({ ...formData, revenueGenerated: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div>
              <Label htmlFor="leadsResponded">Leads que Responderam</Label>
              <Input
                id="leadsResponded"
                type="number"
                min="0"
                value={formData.leadsResponded}
                onChange={(e) =>
                  setFormData({ ...formData, leadsResponded: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div>
              <Label htmlFor="responseTimeHours">Tempo Médio Resposta (horas)</Label>
              <Input
                id="responseTimeHours"
                type="number"
                min="0"
                step="0.1"
                value={formData.responseTimeHours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    responseTimeHours: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <textarea
              id="notes"
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionais sobre o período..."
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Salvando...' : 'Salvar Dados do Funil'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

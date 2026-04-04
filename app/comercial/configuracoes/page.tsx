'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import {
  CommercialCalendarConfig,
  CommercialTemplateSummary,
  listCommercialCalendarConfigs,
  createCommercialCalendarConfig,
  updateCommercialCalendarConfig,
  runCommercialCalendarSync,
  listCommercialTemplates,
  createCommercialTemplate,
  publishCommercialTemplate,
} from '@/lib/api/client/commercial';

type TabKey = 'calendarios' | 'templates';

export default function ComercialConfiguracoesPage() {
  const [tab, setTab] = useState<TabKey>('calendarios');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [calendarConfigs, setCalendarConfigs] = useState<CommercialCalendarConfig[]>([]);
  const [templates, setTemplates] = useState<CommercialTemplateSummary[]>([]);

  const [responsavelKey, setResponsavelKey] = useState('');
  const [calendarId, setCalendarId] = useState('primary');
  const [bookingUrl, setBookingUrl] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');

  const [templateSlug, setTemplateSlug] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateChannel, setTemplateChannel] = useState<'whatsapp' | 'gmail'>('whatsapp');
  const [templateStage, setTemplateStage] = useState<'primeiro_contato' | 'diagnostico_agendado' | 'proposta_enviada' | 'negociacao' | 'fechado'>('primeiro_contato');
  const [templateKey, setTemplateKey] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [configs, templatesRows] = await Promise.all([
        listCommercialCalendarConfigs(),
        listCommercialTemplates(),
      ]);
      setCalendarConfigs(configs);
      setTemplates(templatesRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar configurações comerciais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const sortedConfigs = useMemo(
    () => [...calendarConfigs].sort((a, b) => a.responsavelKey.localeCompare(b.responsavelKey, 'pt-BR')),
    [calendarConfigs],
  );

  const onCreateConfig = async () => {
    try {
      setSaving(true);
      setError(null);
      setStatus(null);
      await createCommercialCalendarConfig({
        responsavelKey: responsavelKey.trim(),
        calendarId: calendarId.trim(),
        bookingUrl: bookingUrl.trim(),
        ownerEmail: ownerEmail.trim(),
        timezone: timezone.trim(),
        isActive: true,
      });
      setStatus('Configuração de calendário criada.');
      setResponsavelKey('');
      setCalendarId('primary');
      setBookingUrl('');
      setOwnerEmail('');
      setTimezone('America/Sao_Paulo');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar configuração de calendário.');
    } finally {
      setSaving(false);
    }
  };

  const onToggleConfig = async (cfg: CommercialCalendarConfig) => {
    try {
      setSaving(true);
      setError(null);
      await updateCommercialCalendarConfig(cfg.id, { isActive: !cfg.isActive });
      setStatus(`Configuração ${cfg.responsavelKey} ${cfg.isActive ? 'desativada' : 'ativada'}.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar configuração.');
    } finally {
      setSaving(false);
    }
  };

  const onSyncNow = async () => {
    try {
      setSaving(true);
      setError(null);
      const result = await runCommercialCalendarSync();
      setStatus(
        `Sync executado: calendários ${result.checkedCalendars}, eventos ${result.processedEvents}, vínculos ${result.linkedLeads}, fila ${result.queued}.`,
      );
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao executar sync do calendário.');
    } finally {
      setSaving(false);
    }
  };

  const onCreateTemplate = async () => {
    try {
      setSaving(true);
      setError(null);
      await createCommercialTemplate({
        channel: templateChannel,
        stage: templateStage,
        slug: templateSlug.trim(),
        name: templateName.trim(),
        content: { templateKey: templateKey.trim() },
        status: 'draft',
      });
      setStatus('Template comercial criado.');
      setTemplateSlug('');
      setTemplateName('');
      setTemplateKey('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar template comercial.');
    } finally {
      setSaving(false);
    }
  };

  const onPublishTemplate = async (templateId: string) => {
    try {
      setSaving(true);
      setError(null);
      await publishCommercialTemplate(templateId);
      setStatus('Template publicado com sucesso.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao publicar template.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      breadcrumb={[{ label: 'Agência', href: '/' }, { label: 'Comercial', href: '/comercial' }, { label: 'Configurações' }]}
      title="Configurações Comerciais"
      description="Calendários por responsável e governança de templates."
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={tab === 'calendarios' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setTab('calendarios')}
          >
            Calendários
          </Button>
          <Button
            variant={tab === 'templates' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setTab('templates')}
          >
            Templates
          </Button>
        </div>

        {status && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            {status}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {tab === 'calendarios' && (
          <section className="rounded-2xl border border-border/50 bg-card/20 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Configuração por Responsável</p>
              <Button variant="outline" size="sm" className="h-7 text-[11px] cursor-pointer" onClick={onSyncNow} disabled={saving}>
                Rodar sync agora
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <input
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs"
                placeholder="Responsável"
                value={responsavelKey}
                onChange={(e) => setResponsavelKey(e.target.value)}
              />
              <input
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs"
                placeholder="Calendar ID"
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
              />
              <input
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs"
                placeholder="Booking URL Google"
                value={bookingUrl}
                onChange={(e) => setBookingUrl(e.target.value)}
              />
              <input
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs"
                placeholder="Owner email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
              />
              <div className="flex gap-2">
                <input
                  className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2 text-xs"
                  placeholder="Timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />
                <Button className="h-8 text-xs cursor-pointer" onClick={onCreateConfig} disabled={saving || !responsavelKey || !bookingUrl || !ownerEmail}>
                  Salvar
                </Button>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando configurações...</p>
            ) : (
              <div className="space-y-2">
                {sortedConfigs.map((cfg) => (
                  <div key={cfg.id} className="rounded-xl border border-border/40 bg-background/20 px-3 py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{cfg.responsavelKey}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{cfg.bookingUrl}</p>
                      <p className="text-[10px] text-muted-foreground">{cfg.ownerEmail} · {cfg.timezone}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] cursor-pointer"
                      onClick={() => onToggleConfig(cfg)}
                      disabled={saving}
                    >
                      {cfg.isActive ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'templates' && (
          <section className="rounded-2xl border border-border/50 bg-card/20 p-4 space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Templates Comerciais</p>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <select
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs cursor-pointer"
                value={templateChannel}
                onChange={(e) => setTemplateChannel(e.target.value as 'whatsapp' | 'gmail')}
              >
                <option value="whatsapp">whatsapp</option>
                <option value="gmail">gmail</option>
              </select>
              <select
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs cursor-pointer"
                value={templateStage}
                onChange={(e) => setTemplateStage(e.target.value as typeof templateStage)}
              >
                <option value="primeiro_contato">primeiro_contato</option>
                <option value="diagnostico_agendado">diagnostico_agendado</option>
                <option value="proposta_enviada">proposta_enviada</option>
                <option value="negociacao">negociacao</option>
                <option value="fechado">fechado</option>
              </select>
              <input
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs"
                placeholder="slug"
                value={templateSlug}
                onChange={(e) => setTemplateSlug(e.target.value)}
              />
              <input
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs"
                placeholder="nome"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
              <div className="flex gap-2">
                <input
                  className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2 text-xs"
                  placeholder="templateKey"
                  value={templateKey}
                  onChange={(e) => setTemplateKey(e.target.value)}
                />
                <Button
                  className="h-8 text-xs cursor-pointer"
                  onClick={onCreateTemplate}
                  disabled={saving || !templateSlug || !templateName || !templateKey}
                >
                  Criar
                </Button>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando templates...</p>
            ) : (
              <div className="space-y-2">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="rounded-xl border border-border/40 bg-background/20 px-3 py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tpl.name}</p>
                      <p className="text-[11px] text-muted-foreground">{tpl.slug} · {tpl.channel} · {tpl.stage}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {tpl.latestStatus || 'sem versão'} {tpl.latestVersion ? `v${tpl.latestVersion}` : ''}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] cursor-pointer"
                      onClick={() => onPublishTemplate(tpl.id)}
                      disabled={saving}
                    >
                      Publicar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </PageShell>
  );
}

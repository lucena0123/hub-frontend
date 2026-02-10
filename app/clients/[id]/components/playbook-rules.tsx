'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Filter, Plus, Settings2, Trash2, Pencil } from 'lucide-react';
import axios from 'axios';

import type { OptimizationCenterPlaybook } from '@/types';
import type { OptimizationRule } from '@/types/optimization';
import { getOptimizationCenterPlaybook } from '@/lib/api/client/analytics';
import { useOptimizationStore } from '@/lib/stores/optimization-store';
import { cn } from '@/lib/utils';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RuleConfigDialog } from '@/components/optimization/rule-config-dialog';

const severityStyles: Record<OptimizationRule['severity'], string> = {
  critical: 'bg-rose-500 text-white border-rose-600',
  warning: 'bg-amber-400 text-amber-950 border-amber-500',
  opportunity: 'bg-emerald-500 text-white border-emerald-600',
  info: 'bg-muted text-muted-foreground border-border',
};

const actionLabel: Record<OptimizationRule['action'], string> = {
  review: 'revisar',
  pause: 'pausar',
  refresh: 'atualizar',
  scale: 'escalar',
  track: 'monitorar',
  sync: 'sincronizar',
};

const categoryLabel: Record<OptimizationRule['category'], string> = {
  campaign: 'campanha',
  creative: 'criativo',
  adset: 'conjunto',
  qualification: 'qualificação',
  data: 'dados',
};

const levelOptions: OptimizationRule['level'][] = ['campaign', 'creative', 'adset', 'qualification', 'data'];
const severityOptions: OptimizationRule['severity'][] = ['critical', 'warning', 'opportunity', 'info'];
const categoryOptions: OptimizationRule['category'][] = ['campaign', 'creative', 'adset', 'qualification', 'data'];
const actionOptions: OptimizationRule['action'][] = ['review', 'pause', 'refresh', 'scale', 'track', 'sync'];

type RuleEditorMode = 'create' | 'edit';

type IntelligentTemplate = {
  id: string;
  label: string;
  level: OptimizationRule['level'];
  title: string;
  description: string;
  condition: string;
  severity: OptimizationRule['severity'];
  category: OptimizationRule['category'];
  action: OptimizationRule['action'];
  parametersSchema?: Record<string, unknown> | null;
  parametersTemplate?: Record<string, unknown> | null;
};

const intelligentTemplates: IntelligentTemplate[] = [
  {
    id: 'campaign.cpl-bad',
    label: 'Campanha · CPL acima do ruim',
    level: 'campaign',
    title: 'CPL acima do ruim (tema)',
    description: 'CPL 7d acima do limite ruim do tema com gasto mínimo.',
    condition:
      '{"and":[{">=":[{"var":"metrics.cplLast7"},{"var":"thresholds.targetCplBadMin"}]},{">=":[{"var":"metrics.spendLast7"},{"var":"params.minSpend"}]}]}',
    severity: 'critical',
    category: 'campaign',
    action: 'refresh',
    parametersSchema: {
      type: 'object',
      properties: { minSpend: { type: 'number', minimum: 0 } },
      required: ['minSpend'],
      additionalProperties: true,
    },
    parametersTemplate: { minSpend: 150 },
  },
  {
    id: 'campaign.frequency-high',
    label: 'Campanha · Frequência alta',
    level: 'campaign',
    title: 'Frequência alta',
    description: 'Frequência 7d acima do limite do tema.',
    condition:
      '{">=":[{"var":"metrics.avgFrequencyLast7"},{"var":"thresholds.frequencyWarning"}]}',
    severity: 'warning',
    category: 'campaign',
    action: 'review',
  },
  {
    id: 'campaign.contacts-drop',
    label: 'Campanha · Queda de contatos',
    level: 'campaign',
    title: 'Queda de contatos',
    description: 'Queda forte de contatos na última semana.',
    condition: '{"<=":[{"var":"metrics.contactsDelta"},-50]}',
    severity: 'warning',
    category: 'campaign',
    action: 'review',
  },
  {
    id: 'creative.hook-low',
    label: 'Criativo · Hook baixo (vídeo)',
    level: 'creative',
    title: 'Hook baixo em vídeo',
    description: 'Hook rate abaixo do mínimo esperado para vídeo.',
    condition:
      '{"and":[{"var":"attributes.isVideo"},{"<":[{"var":"metrics.hookRateAvg"},{"var":"thresholds.hookRateMin"}]}]}',
    severity: 'warning',
    category: 'creative',
    action: 'refresh',
  },
  {
    id: 'creative.cpl-high',
    label: 'Criativo · CPL alto (gasto mínimo)',
    level: 'creative',
    title: 'Criativo com CPL alto',
    description: 'Criativo com CPL alto e gasto mínimo relevante.',
    condition:
      '{"and":[{">=":[{"var":"metrics.cplLast7"},{"*":[{"var":"thresholds.targetCplBadMin"},{"var":"params.cplMultiplier"}]}]},{">=":[{"var":"metrics.spendLast7"},{"var":"params.minSpend"}]}]}',
    severity: 'warning',
    category: 'creative',
    action: 'pause',
    parametersSchema: {
      type: 'object',
      properties: {
        minSpend: { type: 'number', minimum: 0 },
        cplMultiplier: { type: 'number', minimum: 1 },
      },
      required: ['minSpend', 'cplMultiplier'],
      additionalProperties: true,
    },
    parametersTemplate: { minSpend: 200, cplMultiplier: 1.5 },
  },
  {
    id: 'adset.cpl-high',
    label: 'Conjunto · CPL alto',
    level: 'adset',
    title: 'Conjunto com CPL alto',
    description: 'CPL 7d do conjunto acima do limite ruim do tema.',
    condition:
      '{">=":[{"var":"metrics.cplLast7"},{"var":"thresholds.targetCplBadMin"}]}',
    severity: 'warning',
    category: 'adset',
    action: 'review',
  },
  {
    id: 'adset.frequency-high',
    label: 'Conjunto · Frequência alta',
    level: 'adset',
    title: 'Frequência alta no conjunto',
    description: 'Frequência 7d do conjunto acima do limite do tema.',
    condition:
      '{">=":[{"var":"metrics.avgFrequencyLast7"},{"var":"thresholds.frequencyWarning"}]}',
    severity: 'warning',
    category: 'adset',
    action: 'review',
  },
];

const conditionExamples = [
  {
    label: 'CPL acima do ruim',
    value: '{"<": [{"var":"metrics.cplLast7"}, {"var":"thresholds.targetCplBadMin"}]}',
  },
  {
    label: 'Frequência alta',
    value: '{">=": [{"var":"metrics.avgFrequencyLast7"}, {"var":"thresholds.frequencyWarning"}]}',
  },
  {
    label: 'Queda contatos',
    value: '{"<=": [{"var":"metrics.contactsDelta"}, -50]}',
  },
  {
    label: 'Hook baixo (vídeo)',
    value: '{"and":[{"var":"attributes.isVideo"},{"<":[{"var":"metrics.hookRateAvg"},{"var":"thresholds.hookRateMin"}]}]}',
  },
];

const conditionFieldHints = [
  'metrics.cplLast7',
  'metrics.contactsDelta',
  'metrics.avgFrequencyLast7',
  'metrics.hookRateAvg',
  'thresholds.targetCplBadMin',
  'thresholds.frequencyWarning',
  'thresholds.hookRateMin',
  'params.minSpend',
  'attributes.isVideo',
  'entity.id',
];

const isExecutableCondition = (condition?: string | null) => {
  if (!condition) return false;
  const trimmed = condition.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false;
  try {
    const parsed = JSON.parse(trimmed);
    return typeof parsed === 'object';
  } catch (_error) {
    return false;
  }
};

function RuleEditorDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: RuleEditorMode;
  initialRule?: OptimizationRule | null;
  onSave: (payload: {
    id: string;
    title: string;
    description: string;
    condition: string;
    level: OptimizationRule['level'];
    severity: OptimizationRule['severity'];
    category: OptimizationRule['category'];
    action: OptimizationRule['action'];
    parametersSchema?: Record<string, unknown> | null;
    parametersTemplate?: Record<string, unknown> | null;
  }) => Promise<void>;
}) {
  const { open, onOpenChange, mode, initialRule, onSave } = props;
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('');
  const [level, setLevel] = useState<OptimizationRule['level']>('campaign');
  const [severity, setSeverity] = useState<OptimizationRule['severity']>('warning');
  const [category, setCategory] = useState<OptimizationRule['category']>('campaign');
  const [action, setAction] = useState<OptimizationRule['action']>('review');
  const [schemaText, setSchemaText] = useState('');
  const [templateText, setTemplateText] = useState('');
  const [schemaValid, setSchemaValid] = useState(true);
  const [templateValid, setTemplateValid] = useState(true);
  const [conditionValid, setConditionValid] = useState(true);
  const [conditionError, setConditionError] = useState<string | null>(null);
  const [conditionExecutable, setConditionExecutable] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const parseOptionalJson = (text: string) => {
    if (!text.trim()) return null;
    return JSON.parse(text);
  };

  const validateCondition = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setConditionValid(false);
      setConditionError('Condição obrigatória.');
      setConditionExecutable(false);
      return;
    }
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      setConditionValid(true);
      setConditionError(null);
      setConditionExecutable(false);
      return;
    }
    try {
      JSON.parse(trimmed);
      setConditionValid(true);
      setConditionError(null);
      setConditionExecutable(true);
    } catch (_error) {
      setConditionValid(false);
      setConditionError('JSON Logic inválido.');
      setConditionExecutable(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initialRule) {
      setId(initialRule.id);
      setTitle(initialRule.title ?? initialRule.name ?? '');
      setDescription(initialRule.description ?? '');
      const nextCondition = initialRule.condition ?? '';
      setCondition(nextCondition);
      setLevel(initialRule.level);
      setSeverity(initialRule.severity);
      setCategory(initialRule.category);
      setAction(initialRule.action);
      setSchemaText(initialRule.parametersSchema ? JSON.stringify(initialRule.parametersSchema, null, 2) : '');
      setTemplateText(initialRule.parametersTemplate ? JSON.stringify(initialRule.parametersTemplate, null, 2) : '');
      setSchemaValid(true);
      setTemplateValid(true);
      validateCondition(nextCondition);
      setSelectedTemplateId('');
      setErrorMessage(null);
    } else {
      setId('');
      setTitle('');
      setDescription('');
      setCondition('');
      setLevel('campaign');
      setSeverity('warning');
      setCategory('campaign');
      setAction('review');
      setSchemaText('');
      setTemplateText('');
      setSchemaValid(true);
      setTemplateValid(true);
      setConditionValid(true);
      setConditionError(null);
      setConditionExecutable(false);
      setSelectedTemplateId('');
      setErrorMessage(null);
    }
  }, [open, mode, initialRule]);

  useEffect(() => {
    setSelectedTemplateId('');
  }, [level]);

  const handleSave = async () => {
    if (!id.trim() || !title.trim() || !description.trim() || !condition.trim()) {
      setErrorMessage('Preencha todos os campos obrigatórios.');
      return;
    }
    if (!schemaValid || !templateValid) {
      setErrorMessage('Corrija os JSONs inválidos.');
      return;
    }
    if (!conditionValid) {
      setErrorMessage('Condição inválida.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      await onSave({
        id: id.trim(),
        title: title.trim(),
        description: description.trim(),
        condition: condition.trim(),
        level,
        severity,
        category,
        action,
        parametersSchema: parseOptionalJson(schemaText),
        parametersTemplate: parseOptionalJson(templateText),
      });
      onOpenChange(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as { error?: string; details?: Array<{ message?: string }> } | undefined;
        if (data?.details?.length) {
          setErrorMessage(data.details.map((d) => d.message).filter(Boolean).join(' · '));
        } else {
          setErrorMessage(data?.error ?? error.message);
        }
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Erro ao salvar regra.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Nova regra' : 'Editar regra'}</DialogTitle>
          <DialogDescription>
            Regras customizadas ficam disponíveis no playbook e no kanban.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="rule-id">ID da regra</Label>
            <Input
              id="rule-id"
              value={id}
              onChange={(event) => setId(event.target.value)}
              placeholder="ex: campaign.cpl-high"
              disabled={mode === 'edit'}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="rule-title">Título</Label>
            <Input id="rule-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="rule-desc">Descrição</Label>
            <Textarea id="rule-desc" value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="rule-condition">Condição (texto)</Label>
            <Textarea
              id="rule-condition"
              value={condition}
              onChange={(event) => {
                const value = event.target.value;
                setCondition(value);
                validateCondition(value);
              }}
              className={cn('font-mono text-xs', !conditionValid && 'border-red-500 focus-visible:ring-red-500')}
            />
            {!conditionValid && conditionError && (
              <span className="text-[10px] text-red-500">{conditionError}</span>
            )}
            <p className="text-[11px] text-muted-foreground">
              Para execução automática, use JSON Logic. Exemplo:
              <span className="ml-1 font-mono">
                {"{\"<\": [{\"var\":\"metrics.cplLast7\"}, {\"var\":\"thresholds.targetCplBadMin\"}]}"}
              </span>
            </p>
            <div className="rounded-md border bg-muted/30 p-3 space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px]">
                    {conditionExecutable ? 'executável' : 'texto livre'}
                  </Badge>
                  <span>Templates inteligentes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedTemplateId} onValueChange={(val) => setSelectedTemplateId(val)}>
                    <SelectTrigger className="h-8 min-w-[220px]">
                      <SelectValue placeholder="Escolha um template" />
                    </SelectTrigger>
                    <SelectContent>
                      {intelligentTemplates
                        .filter((tpl) => tpl.level === level)
                        .map((tpl) => (
                          <SelectItem key={tpl.id} value={tpl.id}>
                            {tpl.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8"
                    disabled={!selectedTemplateId}
                    onClick={() => {
                      const tpl = intelligentTemplates.find((t) => t.id === selectedTemplateId);
                      if (!tpl) return;
                      const hasContent = Boolean(
                        title.trim() || description.trim() || condition.trim() || schemaText.trim() || templateText.trim()
                      );
                      if (hasContent) {
                        const confirmed = window.confirm('Aplicar template vai sobrescrever os campos atuais. Continuar?');
                        if (!confirmed) return;
                      }
                      if (!id.trim()) setId(tpl.id);
                      setTitle(tpl.title);
                      setDescription(tpl.description);
                      setCondition(tpl.condition);
                      validateCondition(tpl.condition);
                      setSeverity(tpl.severity);
                      setCategory(tpl.category);
                      setAction(tpl.action);
                      setSchemaText(tpl.parametersSchema ? JSON.stringify(tpl.parametersSchema, null, 2) : '');
                      setTemplateText(tpl.parametersTemplate ? JSON.stringify(tpl.parametersTemplate, null, 2) : '');
                      setSchemaValid(true);
                      setTemplateValid(true);
                    }}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {conditionExamples.map((example) => (
                  <Button
                    key={example.label}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => {
                      setCondition(example.value);
                      validateCondition(example.value);
                    }}
                  >
                    {example.label}
                  </Button>
                ))}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Campos úteis</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {conditionFieldHints.map((field) => (
                    <span key={field} className="rounded border px-2 py-1 text-[11px] font-mono text-foreground">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-2">
              <Label>Nível</Label>
              <Select value={level} onValueChange={(val) => setLevel(val as OptimizationRule['level'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {levelOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Severidade</Label>
              <Select value={severity} onValueChange={(val) => setSeverity(val as OptimizationRule['severity'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {severityOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(val) => setCategory(val as OptimizationRule['category'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Ação</Label>
              <Select value={action} onValueChange={(val) => setAction(val as OptimizationRule['action'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {actionOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="rule-template">Parâmetros padrão (JSON)</Label>
            <Textarea
              id="rule-template"
              value={templateText}
              onChange={(event) => {
                setTemplateText(event.target.value);
                try {
                  if (event.target.value.trim()) JSON.parse(event.target.value);
                  setTemplateValid(true);
                } catch (_) {
                  setTemplateValid(false);
                }
              }}
              className={cn('font-mono text-xs', !templateValid && 'border-red-500 focus-visible:ring-red-500')}
              placeholder='{"minSpend": 200}'
            />
            {!templateValid && <span className="text-[10px] text-red-500">JSON inválido.</span>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="rule-schema">Schema de parâmetros (JSON Schema)</Label>
            <Textarea
              id="rule-schema"
              value={schemaText}
              onChange={(event) => {
                setSchemaText(event.target.value);
                try {
                  if (event.target.value.trim()) JSON.parse(event.target.value);
                  setSchemaValid(true);
                } catch (_) {
                  setSchemaValid(false);
                }
              }}
              className={cn('font-mono text-xs', !schemaValid && 'border-red-500 focus-visible:ring-red-500')}
              placeholder='{"type":"object","properties":{"minSpend":{"type":"number"}},"required":["minSpend"]}'
            />
            {!schemaValid && <span className="text-[10px] text-red-500">JSON inválido.</span>}
          </div>

          {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ClientPlaybookRules({ clientId }: { clientId: string }) {
  const { rules, fetchRules, toggleRule, createRule, updateRuleMeta, deleteRule } = useOptimizationStore();
  const [playbook, setPlaybook] = useState<OptimizationCenterPlaybook | null>(null);
  const [playbookLoading, setPlaybookLoading] = useState(true);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDisabled, setShowDisabled] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<OptimizationRule | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<RuleEditorMode>('create');
  const [editorRule, setEditorRule] = useState<OptimizationRule | null>(null);

  useEffect(() => {
    let active = true;
    setPlaybookLoading(true);
    getOptimizationCenterPlaybook()
      .then((data) => {
        if (active) setPlaybook(data);
      })
      .catch(() => {
        if (active) setPlaybook(null);
      })
      .finally(() => {
        if (active) setPlaybookLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setRulesLoading(true);
    fetchRules(clientId)
      .catch(() => undefined)
      .finally(() => {
        if (active) setRulesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [clientId, fetchRules]);

  const filteredRules = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rules.filter((rule) => {
      if (!showDisabled && rule.enabled === false) return false;
      if (!term) return true;
      const haystack = [
        rule.id,
        rule.title,
        rule.name,
        rule.description,
        rule.condition,
        rule.category,
        rule.action,
        rule.level,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [rules, search, showDisabled]);

  const handleToggle = async (ruleId: string, enabled: boolean) => {
    await toggleRule(ruleId, enabled, clientId);
  };

  const openConfig = (rule: OptimizationRule) => {
    setSelectedRule(rule);
    setConfigOpen(true);
  };

  const openCreate = () => {
    setEditorMode('create');
    setEditorRule(null);
    setEditorOpen(true);
  };

  const openEdit = (rule: OptimizationRule) => {
    setEditorMode('edit');
    setEditorRule(rule);
    setEditorOpen(true);
  };

  const handleDelete = async (rule: OptimizationRule) => {
    if (rule.source !== 'custom') return;
    const confirmed = window.confirm(`Excluir a regra "${rule.title ?? rule.id}"?`);
    if (!confirmed) return;
    await deleteRule(rule.id, clientId);
  };

  const playbookSummary = playbook ? (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground">{playbook.key}</span>
      <span>v{playbook.version}</span>
      <span>Atualizado: {playbook.updatedAt}</span>
      <span>Temas: {playbook.themes.length}</span>
      <span>Regras: {playbook.rules.length}</span>
    </div>
  ) : (
    <span className="text-xs text-muted-foreground">Playbook não disponível.</span>
  );

  return (
    <div className="space-y-4">
      <RuleConfigDialog
        key={selectedRule?.id ?? 'rule-config'}
        open={configOpen}
        onOpenChange={setConfigOpen}
        rule={selectedRule}
        clientId={clientId}
      />
      <RuleEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        mode={editorMode}
        initialRule={editorRule}
        onSave={async (payload) => {
          if (editorMode === 'create') {
            await createRule(payload, clientId);
          } else if (editorRule) {
            const { id: _id, ...rest } = payload;
            await updateRuleMeta(editorRule.id, rest, clientId);
          }
        }}
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <CardTitle>Playbook de Otimização</CardTitle>
            </div>
          </div>
          <CardDescription>
            Configure regras, parâmetros e ativação por cliente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {playbookLoading ? (
            <p className="text-sm text-muted-foreground">Carregando playbook...</p>
          ) : (
            <div className="space-y-2">
              {playbookSummary}
              {playbook?.description ? (
                <p className="text-xs text-muted-foreground">{playbook.description}</p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Regras do Playbook</CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Filter className="h-3 w-3" />
                {filteredRules.length} de {rules.length}
              </div>
              <Button size="sm" onClick={openCreate} className="gap-2">
                <Plus className="h-3 w-3" />
                Nova regra
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por id, condição, categoria..."
                className="pl-3"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Mostrar desativadas</span>
              <Switch checked={showDisabled} onCheckedChange={setShowDisabled} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {rulesLoading ? (
            <p className="text-sm text-muted-foreground">Carregando regras...</p>
          ) : filteredRules.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma regra encontrada.</p>
          ) : (
            <ScrollArea className="max-h-[520px] pr-4">
              <div className="space-y-3">
                {filteredRules.map((rule) => {
                  const title = rule.title ?? rule.name ?? rule.id;
                  const enabled = rule.enabled ?? true;
                  const executable = isExecutableCondition(rule.condition);
                  return (
                    <div
                      key={rule.id}
                      className={cn(
                        'rounded-lg border bg-card p-4 transition',
                        !enabled && 'opacity-70'
                      )}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-semibold">{title}</h4>
                            <Badge variant="outline" className={cn('text-[10px]', severityStyles[rule.severity])}>
                              {rule.severity}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {categoryLabel[rule.category]}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {actionLabel[rule.action]}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {rule.level}
                            </Badge>
                            {executable && (
                              <Badge variant="outline" className="text-[10px]">
                                executável
                              </Badge>
                            )}
                            {rule.source === 'custom' && (
                              <Badge variant="outline" className="text-[10px]">
                                custom
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{rule.description}</p>
                          <div className="rounded-md bg-muted/40 p-2 font-mono text-[11px] text-muted-foreground">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
                              Condição
                            </span>
                            <div className="mt-1 text-foreground">{rule.condition || '—'}</div>
                          </div>
                        </div>

                        <div className="flex flex-row items-center gap-3 lg:flex-col lg:items-end">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{enabled ? 'Ativa' : 'Pausada'}</span>
                            <Switch checked={enabled} onCheckedChange={(val) => handleToggle(rule.id, val)} />
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-2"
                            onClick={() => openConfig(rule)}
                          >
                            <Settings2 className="h-3 w-3" />
                            Editar inputs
                          </Button>
                          {rule.source === 'custom' && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 gap-2 text-xs"
                                onClick={() => openEdit(rule)}
                              >
                                <Pencil className="h-3 w-3" />
                                Editar regra
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 gap-2 text-xs text-destructive"
                                onClick={() => handleDelete(rule)}
                              >
                                <Trash2 className="h-3 w-3" />
                                Excluir
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 rounded-md border border-dashed bg-muted/20 p-3">
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Inputs (parâmetros por cliente)
                        </div>
                        {rule.parameters && Object.keys(rule.parameters).length > 0 ? (
                          <pre className="mt-2 max-h-[200px] overflow-auto text-[11px] text-foreground">
                            {JSON.stringify(rule.parameters, null, 2)}
                          </pre>
                        ) : (
                          <p className="mt-2 text-xs text-muted-foreground">Sem parâmetros customizados.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

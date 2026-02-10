'use client';

import { useEffect, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle,
    Settings,
    TrendingDown,
    TrendingUp,
    Activity,
    AlertOctagon,
    ShieldCheck,
    ShieldAlert,
} from 'lucide-react';

import {
    getAnomalies,
    getCampaignHealth,
    getAutoApprovalConfig,
    updateAutoApprovalConfig,
    type AnomalyDetection,
    type CampaignHealthResult,
    type AutoApprovalConfig,
} from '@/lib/api/client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClientPlaybookRules } from './playbook-rules';

interface ClientOptimizationProps {
    clientId: string;
}

export function ClientOptimization({ clientId }: ClientOptimizationProps) {
    const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
    const [health, setHealth] = useState<CampaignHealthResult[]>([]);
    const [config, setConfig] = useState<AutoApprovalConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [anomaliesData, healthData, configData] = await Promise.all([
                    getAnomalies(clientId),
                    getCampaignHealth(clientId),
                    getAutoApprovalConfig(clientId),
                ]);
                setAnomalies(anomaliesData);
                setHealth(healthData);
                setConfig(configData);
            } catch (error) {
                console.error('Failed to fetch optimization data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [clientId]);

    const toggleRule = async (ruleKey: string, enabled: boolean) => {
        if (!config) return;

        const newRules = {
            ...config.autoApproveRules,
            [ruleKey]: { ...config.autoApproveRules[ruleKey], enabled },
        };

        try {
            const updated = await updateAutoApprovalConfig(clientId, {
                autoApproveRules: newRules,
            });
            setConfig(updated);
        } catch (error) {
            console.error('Failed to update rule:', error);
        }
    };

    const toggleAutoApprove = async (enabled: boolean) => {
        try {
            const updated = await updateAutoApprovalConfig(clientId, {
                autoApproveEnabled: enabled,
            });
            setConfig(updated);
        } catch (error) {
            console.error('Failed to update auto-approve:', error);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Carregando dados de otimização...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Health Score Card */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Saúde da Conta
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline space-x-2">
                            <span className="text-3xl font-bold">
                                {health.length > 0
                                    ? (health.reduce((acc, h) => acc + h.score, 0) / health.length).toFixed(0)
                                    : '-'}
                            </span>
                            <span className="text-sm text-muted-foreground">/ 100</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Média baseada em {health.length} campanhas ativas
                        </p>
                    </CardContent>
                </Card>

                {/* Anomalies Card */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Anomalias (7d)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline space-x-2">
                            <span className="text-3xl font-bold">{anomalies.length}</span>
                            <span className="text-sm text-muted-foreground">detectadas</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {anomalies.filter((a) => a.severity === 'critical').length} críticas,{' '}
                            {anomalies.filter((a) => a.severity === 'warning').length} alertas
                        </p>
                    </CardContent>
                </Card>

                {/* Auto-Approval Status */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Piloto Automático
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            {config?.autoApproveEnabled ? (
                                <>
                                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                    <span className="font-bold text-emerald-600">Ativado</span>
                                </>
                            ) : (
                                <>
                                    <ShieldAlert className="h-5 w-5 text-amber-500" />
                                    <span className="font-bold text-amber-600">Desativado</span>
                                </>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {Object.values(config?.autoApproveRules || {}).filter((r) => r.enabled).length}{' '}
                            regras ativas
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="health" className="w-full">
                <TabsList>
                    <TabsTrigger value="health">Saúde das Campanhas</TabsTrigger>
                    <TabsTrigger value="anomalies">Anomalias</TabsTrigger>
                    <TabsTrigger value="config">Configuração (Auto-Pilot)</TabsTrigger>
                    <TabsTrigger value="playbook">Playbook</TabsTrigger>
                </TabsList>

                <TabsContent value="health" className="space-y-4">
                    {health.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                Nenhuma campanha com dados suficientes para análise de saúde.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {health.map((camp) => (
                                <Card key={camp.campaignId}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base truncate" title={camp.campaignName}>
                                                {camp.campaignName}
                                            </CardTitle>
                                            <Badge
                                                variant={
                                                    camp.grade === 'A' || camp.grade === 'B'
                                                        ? 'default' // was success, but default is usually dark/primary. shadcn default might need explicit class for green
                                                        : camp.grade === 'C'
                                                            ? 'secondary' // was warning
                                                            : 'destructive'
                                                }
                                                className={
                                                    camp.grade === 'A' || camp.grade === 'B'
                                                        ? 'bg-emerald-500 hover:bg-emerald-600'
                                                        : camp.grade === 'C'
                                                            ? 'bg-amber-500 hover:bg-amber-600'
                                                            : ''
                                                }
                                            >
                                                Grade {camp.grade} ({camp.score})
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-4">{camp.recommendation}</p>
                                        <div className="space-y-2">
                                            {camp.factors.map((factor) => (
                                                <div key={factor.name} className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">{factor.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${factor.score >= 80
                                                                        ? 'bg-emerald-500'
                                                                        : factor.score >= 50
                                                                            ? 'bg-amber-500'
                                                                            : 'bg-red-500'
                                                                    }`}
                                                                style={{ width: `${factor.score}%` }}
                                                            />
                                                        </div>
                                                        <span className="w-6 text-right">{factor.score}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="anomalies">
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Anomalias</CardTitle>
                            <CardDescription>
                                Eventos fora do padrão detectados nos últimos 7 dias.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[400px] pr-4">
                                {anomalies.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">
                                        Nenhuma anomalia detectada recentemente.
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {anomalies.map((anomaly) => (
                                            <div
                                                key={anomaly.id}
                                                className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                                            >
                                                <div
                                                    className={`mt-1 p-2 rounded-full ${anomaly.severity === 'critical'
                                                            ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                                            : 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                                                        }`}
                                                >
                                                    {anomaly.severity === 'critical' ? (
                                                        <AlertOctagon className="h-5 w-5" />
                                                    ) : (
                                                        <AlertTriangle className="h-5 w-5" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-semibold text-sm">{anomaly.campaignName}</h4>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(anomaly.createdAt).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm mt-1">{anomaly.description}</p>
                                                    <div className="flex gap-2 mt-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {anomaly.anomalyType}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {anomaly.changePct > 0 ? '+' : ''}
                                                            {anomaly.changePct.toFixed(1)}%
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="config">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Configuração do Piloto Automático</CardTitle>
                                    <CardDescription>
                                        Gerencie quais regras o sistema pode executar automaticamente nesta conta.
                                    </CardDescription>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Label htmlFor="auto-approve-master">Master Switch</Label>
                                    <Switch
                                        id="auto-approve-master"
                                        checked={config?.autoApproveEnabled}
                                        onCheckedChange={toggleAutoApprove}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {config &&
                                Object.entries(config.autoApproveRules).map(([key, rule]) => (
                                    <div key={key} className="flex items-start justify-between space-x-4 border-b pb-4 last:border-0">
                                        <div className="space-y-1">
                                            <Label className="text-base font-medium">
                                                {key
                                                    .replace(/_/g, ' ')
                                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                {key === 'pause_loser_creative' &&
                                                    'Pausa criativos que gastaram muito sem gerar conversas.'}
                                                {key === 'pause_fatigued_creative' &&
                                                    'Pausa criativos com frequência alta e queda de CTR.'}
                                                {key === 'pause_losing_adset' &&
                                                    'Pausa conjuntos de anúncios com CPL muito acima da meta.'}
                                                {key === 'reduce_budget_overspend' &&
                                                    'Reduz orçamento se o pacing estiver muito acelerado.'}
                                                {key === 'scale_winner_adset' &&
                                                    'Aumenta orçamento de conjuntos com CPL baixo e bom volume.'}
                                            </p>
                                        </div>
                                        <Switch
                                            checked={rule.enabled}
                                            disabled={!config.autoApproveEnabled}
                                            onCheckedChange={(checked) => toggleRule(key, checked)}
                                        />
                                    </div>
                                ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="playbook">
                    <ClientPlaybookRules clientId={clientId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

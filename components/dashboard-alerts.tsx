'use client';

import { useEffect, useState } from 'react';
import { AlertOctagon, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { getGlobalAnomalies, type AnomalyDetection } from '@/lib/api/client';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export function DashboardAlerts() {
    const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const data = await getGlobalAnomalies(50);
                setAnomalies(data);
            } catch (error) {
                console.error('Failed to fetch global anomalies:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAlerts();
    }, []);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Alertas Críticos</CardTitle>
                    <CardDescription>Monitorando anomalias em tempo real</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (anomalies.length === 0) {
        return null; // Don't show card if no critical anomalies (cleaner dash)
        // Or show empty state:
        /*
        return (
          <Card>
            <CardHeader>
                <CardTitle>Alertas Críticos</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
                Nenhuma anomalia crítica detectada nas últimas 24h.
            </CardContent>
          </Card>
        )
        */
    }

    return (
        <Card className="border-red-200 dark:border-red-900/50">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertOctagon className="h-5 w-5 text-red-500" />
                        <CardTitle>Alertas Críticos (24h)</CardTitle>
                    </div>
                    <Badge variant="destructive" className="font-mono">
                        {anomalies.length}
                    </Badge>
                </div>
                <CardDescription>
                    Atenção requerida nas seguintes contas.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                    <div className="divide-y">
                        {anomalies.map((anomaly) => (
                            <div key={anomaly.id} className="p-4 hover:bg-muted/50 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-semibold text-sm">
                                        {anomaly.clientName || 'Cliente desconhecido'}
                                    </h4>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(anomaly.createdAt).toLocaleTimeString('pt-BR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                                <p className="text-sm text-foreground mb-2">
                                    <span className="font-medium text-red-600 dark:text-red-400">
                                        {anomaly.campaignName}:
                                    </span>{' '}
                                    {anomaly.description}
                                </p>
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs border-red-200 text-red-700 bg-red-50 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900">
                                        {anomaly.anomalyType === 'anomaly_cpl_spike' ? 'CPL Alto' :
                                            anomaly.anomalyType === 'anomaly_overspend' ? 'Overspend' :
                                                anomaly.anomalyType === 'anomaly_conversations_drop' ? 'Queda Vol.' : 'Queda CTR'}
                                    </Badge>
                                    <Link href={`/clients/${anomaly.clientId}?tab=optimization`} passHref>
                                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                                            Ver detalhes <ArrowRight className="h-3 w-3" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, AlertOctagon } from 'lucide-react';
import { getAlerts } from '@/lib/api/client';
import type { AlertsResponse } from '@/types';
import { AlertCard } from '@/components/alerts/alert-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const categories = [
  { value: 'all', label: 'Todos' },
  { value: 'roas', label: 'ROAS' },
  { value: 'ctr', label: 'CTR' },
  { value: 'budget', label: 'Budget' },
  { value: 'cpl', label: 'CPL' },
  { value: 'conversions', label: 'Conversoes' },
  { value: 'bpmn', label: 'BPMN' },
];

export default function AlertsPage() {
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true);
        const response = await getAlerts();
        setData(response);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, []);

  const filteredAlerts = useMemo(() => {
    if (!data) return [];
    if (category === 'all') return data.alerts;
    return data.alerts.filter((alert) => alert.category === category);
  }, [data, category]);

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading alerts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Alertas</h1>
            <p className="text-muted-foreground">
              Monitoramento automatico de performance e BPMN
            </p>
          </div>
          {data && (
            <div className="flex items-center gap-2">
              <Badge className="bg-rose-100 text-rose-700">
                <AlertOctagon className="h-3.5 w-3.5" />
                {data.critical} critical
              </Badge>
              <Badge className="bg-amber-100 text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5" />
                {data.warning} warning
              </Badge>
              <Badge variant="outline">{data.total} total</Badge>
            </div>
          )}
        </div>

        <Tabs value={category} onValueChange={setCategory}>
          <TabsList variant="line">
            {categories.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum alerta encontrado para este filtro.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

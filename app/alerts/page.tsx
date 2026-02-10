'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, AlertOctagon, Terminal } from 'lucide-react';
import { getAlerts } from '@/lib/api/client';
import type { AlertsResponse } from '@/types';
import { AlertCard } from '@/components/alerts/alert-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const categories = [
  { value: 'all', label: 'ALL_SYSTEMS' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'qualification', label: 'Qualification' },
  { value: 'trend', label: 'Trend' },
  { value: 'stalled', label: 'Stalled' },
  { value: 'sync', label: 'Sync' },
  { value: 'budget', label: 'Budget' },
  { value: 'roas', label: 'ROAS' },
  { value: 'ctr', label: 'CTR' },
  { value: 'cpl', label: 'CPL' },
  { value: 'conversions', label: 'Conversions' },
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground font-mono text-sm tracking-widest">SCANNING_SYSTEM_ALERTS...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive font-mono">SYSTEM_ERROR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground font-mono">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-mono text-foreground">
      <div className="max-w-[1600px] mx-auto space-y-8">

        {/* Header HUD */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-4 border-b border-primary/20 pb-6 relative">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-primary/50 text-xs tracking-[0.3em] mb-1">
              <Terminal className="h-3 w-3" />
              <span>TERMINAL_ID: SYSTEM_ALERTS</span>
            </div>
            <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
              ALERT_LOGS
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
              Automated Performance & BPMN Monitoring
            </p>
          </div>

          {data && (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center border border-rose-500/30 bg-rose-500/10 p-2 rounded-sm min-w-[80px]">
                <span className="text-[10px] text-rose-500 uppercase font-bold flex items-center gap-1">
                  <AlertOctagon className="h-3 w-3" /> CRITICAL
                </span>
                <span className="text-xl font-black text-rose-500 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]">
                  {data.critical}
                </span>
              </div>
              <div className="flex flex-col items-center border border-amber-500/30 bg-amber-500/10 p-2 rounded-sm min-w-[80px]">
                <span className="text-[10px] text-amber-500 uppercase font-bold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> WARNING
                </span>
                <span className="text-xl font-black text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]">
                  {data.warning}
                </span>
              </div>
              <div className="flex flex-col items-center border border-border/50 bg-card/30 p-2 rounded-sm min-w-[80px]">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">TOTAL</span>
                <span className="text-xl font-black text-foreground">{data.total}</span>
              </div>
            </div>
          )}
        </div>

        {/* Filter Scroll Area */}
        <div className="w-full overflow-x-auto pb-2 no-scrollbar mask-horizontal-fade">
          <div className="flex gap-1">
            {categories.map((item) => (
              <button
                key={item.value}
                onClick={() => setCategory(item.value)}
                className={cn(
                  "px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all border shrink-0",
                  category === item.value
                    ? 'bg-primary/10 border-primary text-primary shadow-[0_0_10px_-4px_var(--color-primary)]'
                    : 'bg-card/30 border-border/50 text-muted-foreground hover:bg-card/50 hover:text-foreground'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-border/50 rounded-lg opacity-50">
            <p className="text-muted-foreground text-sm tracking-widest">NO_ALERTS_DETECTED_FOR_FILTER</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className="relative pl-4">
                <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-border/50" />
                <div className="absolute left-[-2px] top-6 w-[5px] h-[5px] rounded-full bg-primary" />
                <AlertCard alert={alert} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

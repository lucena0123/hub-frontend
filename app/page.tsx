'use client';

import { useEffect, useState } from 'react';
import { getDashboardOverview } from '@/lib/api/client';
import type { DashboardOverview } from '@/types';
import {
  Activity,
  Cpu,
  Terminal,
  Wifi,
  Zap,
  AlertTriangle,
  Server
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// --- Type Guards & Utils ---
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isDashboardOverview = (value: unknown): value is DashboardOverview => {
  if (!isRecord(value)) return false;
  // (Simplified validation for brevity, assuming API contract holds)
  return 'clients' in value && 'campaigns' in value; // minimalistic check
};

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return 'ERR';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function timeAgo(timestamp: string): string {
  const diffMin = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 60000);
  if (diffMin < 1) return 'JUST_NOW';
  if (diffMin < 60) return `T-${diffMin}m`;
  return `T-${Math.floor(diffMin / 60)}h`;
}

// --- Neon Components ---
const HudMetric = ({ label, value, unit, color = "text-primary" }: { label: string, value: string | number, unit?: string, color?: string }) => (
  <div className="flex flex-col border-r border-border/50 px-6 last:border-0 relative overflow-hidden group">
    <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
    <span className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</span>
    <div className="flex items-baseline gap-1 relative z-10">
      <span className={cn("text-2xl font-bold font-mono tracking-tighter", color)}>{value}</span>
      {unit && <span className="text-xs text-muted-foreground font-mono">{unit}</span>}
    </div>
  </div>
);

const PlatformBar = ({ name, value, total, color }: { name: string, value: number, total: number, color: string }) => (
  <div className="group space-y-1">
    <div className="flex justify-between text-xs uppercase tracking-wider">
      <span className="text-muted-foreground group-hover:text-primary transition-colors">{'>'}{'>'} {name}</span>
      <span className="font-mono">{value}</span>
    </div>
    <div className="h-1.5 w-full bg-secondary overflow-hidden">
      <div
        className="h-full transition-all duration-500 relative"
        style={{ width: `${(value / total) * 100}%`, backgroundColor: color }}
      >
        <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white/50 shadow-[0_0_5px_white]" />
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data: unknown = await getDashboardOverview();
        if (isDashboardOverview(data)) {
          setOverview(data);
        } else {
          // Fallback mock check or error
          setError("SYSTEM_FAILURE: INVALID_DATA_STREAM");
        }
      } catch {
        setError("CONNECTION_SEVERED");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center font-mono">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 border-4 border-primary/30 rounded-full animate-spin border-t-primary shadow-[0_0_20px_var(--color-primary)]" />
          <div className="absolute inset-0 flex items-center justify-center text-xs text-primary animate-pulse">INIT</div>
        </div>
        <div className="text-primary tracking-[0.2em] text-sm animate-pulse">ESTABLISHING UPLINK...</div>
      </div>
    </div>
  );

  if (error || !overview) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="border border-destructive/50 bg-destructive/10 p-8 rounded text-center space-y-4 max-w-md relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-1 bg-destructive animate-pulse" />
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-destructive neon-text tracking-widest">SYSTEM FAILURE</h2>
        <p className="font-mono text-destructive/80 text-sm">{error}</p>
        <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/20 w-full mt-4" onClick={() => window.location.reload()}>
          REBOOT SYSTEM
        </Button>
      </div>
    </div>
  );

  // Data processing
  const platformData = Object.entries(overview.campaigns.byPlatform || {}).map(([k, v]) => ({ name: k, value: v as number }));
  const totalCampaigns = overview.campaigns.active;
  const recentLogs = overview.recentActivity || [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-mono text-foreground overflow-x-hidden selection:bg-primary selection:text-background">

      {/* --- HEADER HUD --- */}
      <header className="mb-8 border-b border-primary/20 pb-6 relative">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary/50 text-xs tracking-[0.3em] mb-1">
              <Terminal className="h-3 w-3" />
              <span>TERMINAL_ID: ADTECH_01</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              OPERATOR<span className="text-primary">_V2</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 text-emerald-500 animate-pulse">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_var(--color-emerald-500)]" />
                <span className="text-xs font-bold tracking-widest">SYSTEM ONLINE</span>
              </div>
              <span className="text-muted-foreground text-xs">{new Date().toLocaleTimeString()} UTC-3</span>
            </div>
          </div>
        </div>

        {/* Decorator Line */}
        <div className="absolute bottom-0 right-0 h-[1px] w-1/3 bg-gradient-to-l from-primary to-transparent" />
        <div className="absolute -bottom-[3px] right-0 h-[5px] w-[5px] bg-primary" />
      </header>

      {/* --- STATUS BAR (KPIs) --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-y border-border/50 bg-card/30 backdrop-blur-sm mb-8 relative">
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary/30" />
        <HudMetric
          label="Active Clients"
          value={overview.clients.active}
          unit={`/ ${overview.clients.total}`}
          color="text-primary neon-text"
        />
        <HudMetric
          label="Active Campaigns"
          value={overview.campaigns.active}
          color="text-secondary-foreground neon-text"
        />
        <HudMetric
          label="ROI Index"
          value={overview.performance.avgRoas.toFixed(2)}
          unit="x"
          color="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]"
        />
        <HudMetric
          label="Burn Rate"
          value={formatCurrency(overview.performance.totalSpend)}
          color="text-amber-400"
        />
      </div>

      {/* --- MAIN GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: VISUALIZER (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* Main Chart Panel */}
          <Card className="neon-border bg-card/50 relative overflow-hidden h-[400px]">
            {/* Tech Decorators */}
            <div className="absolute top-0 right-0 p-2 opacity-50"><Wifi className="h-4 w-4 text-primary" /></div>
            <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground tracking-widest">VISUAL_MODE: ANALYTICS</div>

            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg tracking-widest uppercase">
                <Activity className="h-4 w-4 text-primary" />
                Performance_Vector
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {/* Fake Data for Visualization (replace with real history if available) */}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { name: '00:00', val: 4000 }, { name: '04:00', val: 3000 },
                  { name: '08:00', val: 2000 }, { name: '12:00', val: 2780 },
                  { name: '16:00', val: 1890 }, { name: '20:00', val: 2390 },
                  { name: '23:59', val: 3490 },
                ]}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--neon-cyan)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--neon-cyan)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--primary)', borderRadius: '4px' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="val"
                    stroke="var(--neon-cyan)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sub Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-border/50 bg-card/30">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Cpu className="h-4 w-4" /> Pipeline_Load
                  </CardTitle>
                  <Badge variant="outline" className="border-primary/50 text-primary font-mono text-[10px]">
                    {overview.bpmn.avgProgress}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between text-xs">
                    <span>EXECUTION</span>
                    <span className="text-primary">{overview.bpmn.clientsInExecution} PROCS</span>
                  </div>
                  <div className="h-1 bg-secondary w-full">
                    <div className="h-full bg-primary shadow-[0_0_10px_var(--color-primary)] w-[65%]" />
                  </div>

                  <div className="flex justify-between text-xs">
                    <span>MONITORING</span>
                    <span className="text-emerald-500">{overview.bpmn.clientsInMonitoring} UNITS</span>
                  </div>
                  <div className="h-1 bg-secondary w-full">
                    <div className="h-full bg-emerald-500 shadow-[0_0_10px_var(--color-emerald-500)] w-[40%]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/50 bg-card/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Platform_dist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {platformData.map((p, i) => (
                  <PlatformBar
                    key={p.name}
                    name={p.name}
                    value={p.value}
                    total={totalCampaigns}
                    color={i % 2 === 0 ? 'var(--neon-cyan)' : 'var(--neon-magenta)'}
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT COLUMN: LOGS (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="h-full border border-border/50 bg-card/20 backdrop-blur-sm">
            <CardHeader className="border-b border-border/30 pb-3">
              <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Server className="h-3 w-3" /> System_Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-0">
              <div className="space-y-0 relative">
                <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-border/30 border-l border-dashed border-muted-foreground/20" />

                {recentLogs.length > 0 ? recentLogs.map((log, i) => (
                  <div key={i} className="group flex items-start pl-4 pr-4 py-3 hover:bg-white/5 transition-colors relative">
                    <div className={cn(
                      "h-1.5 w-1.5 mt-1.5 mr-4 rounded-full z-10",
                      log.type === 'report' ? "bg-primary shadow-[0_0_5px_var(--color-primary)]" : "bg-emerald-500 shadow-[0_0_5px_var(--color-emerald-500)]"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-foreground/80 truncate">{log.description}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{timeAgo(log.timestamp)}</p>
                    </div>
                  </div>
                )) : (
                  <div className="p-4 text-center text-xs text-muted-foreground font-mono">NO DATA STREAM</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

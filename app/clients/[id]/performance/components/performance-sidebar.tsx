'use client';

import { BarChart3, Gauge, Layers, LayoutDashboard, Sparkles, Target, TrendingDown, TrendingUp, Zap } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type DashboardTab = 'executive' | 'operation' | 'analysis';
type AnalysisTab = 'campaigns' | 'adsets' | 'creatives' | 'breakdowns' | 'business' | 'funnel' | 'progress';

type PerformanceSidebarProps = {
  activeTab: DashboardTab;
  analysisTab: AnalysisTab;
  onAnalysisTabChange: (tab: AnalysisTab) => void;
};

const analysisTabs: Array<{ value: AnalysisTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: 'campaigns', label: 'Campanhas', icon: BarChart3 },
  { value: 'adsets', label: 'Conjuntos', icon: Layers },
  { value: 'creatives', label: 'Criativos', icon: Sparkles },
  { value: 'breakdowns', label: 'Público & Tempo', icon: Gauge },
  { value: 'business', label: 'Leads & Negócio', icon: Target },
  { value: 'funnel', label: 'Funil', icon: TrendingDown },
  { value: 'progress', label: 'Progresso', icon: TrendingUp },
];

export function PerformanceSidebar({ activeTab, analysisTab, onAnalysisTabChange }: PerformanceSidebarProps) {
  return (
    <aside className="premium-sidebar">
      <div className="premium-sidebar-brand">
        <span className="premium-sidebar-kicker">Agency Console</span>
        <div className="premium-sidebar-title">
          Hub<span className="text-primary">.</span>
        </div>
      </div>

      <div className="premium-sidebar-section">
        <p className="premium-sidebar-label">Performance</p>
        <TabsList className="premium-sidebar-tabs" aria-label="Visões">
          <TabsTrigger value="executive">
            <LayoutDashboard className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="operation">
            <Zap className="h-4 w-4" />
            Operação
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <BarChart3 className="h-4 w-4" />
            Análise
          </TabsTrigger>
        </TabsList>
      </div>

      {activeTab === 'analysis' && (
        <div className="premium-sidebar-section mt-3">
          <div className="premium-sidebar-divider" aria-hidden="true" />
          <p className="premium-sidebar-label">Detalhamento</p>
          <Tabs
            value={analysisTab}
            onValueChange={(value) => onAnalysisTabChange(value as AnalysisTab)}
            orientation="vertical"
            className="w-full"
          >
            <TabsList className="premium-sidebar-tabs premium-sidebar-subtabs">
              {analysisTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
      )}
    </aside>
  );
}

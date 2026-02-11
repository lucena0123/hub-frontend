'use client';

import { BarChart3, LayoutDashboard, Zap } from 'lucide-react';

import { TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PerformanceSidebar() {
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
    </aside>
  );
}

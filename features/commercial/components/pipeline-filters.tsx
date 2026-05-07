'use client';

import { ChevronLeft, ChevronRight, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { COLUMNS } from '@/features/commercial/hooks/use-comercial';
import type { CommercialLeadStatus } from '@/lib/api/client/commercial';

type OrigemFilter = 'all' | 'instagram' | 'indicacao' | 'site' | 'whatsapp' | 'outro';

interface PipelineFiltersProps {
  search: string;
  blockedOnly: boolean;
  inconsistentOnly: boolean;
  origemFilter: OrigemFilter;
  responsavelFilter: 'all' | string;
  statusFilter: 'all' | CommercialLeadStatus;
  sortBy: 'updated_desc' | 'name_asc';
  page: number;
  loading: boolean;
  totalLeads: number;
  filteredCount: number;
  pageSize: number;
  responsavelOptions: string[];
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onBlockedOnlyChange: (updater: (previous: boolean) => boolean) => void;
  onInconsistentOnlyChange: (updater: (previous: boolean) => boolean) => void;
  onOrigemFilterChange: (value: OrigemFilter) => void;
  onResponsavelFilterChange: (value: string) => void;
  onStatusFilterChange: (value: 'all' | CommercialLeadStatus) => void;
  onSortByChange: (value: 'updated_desc' | 'name_asc') => void;
  onPageChange: (updater: (previous: number) => number) => void;
  onClearFilters: () => void;
  onExportCsv: () => void;
}

export function PipelineFilters({
  search,
  blockedOnly,
  inconsistentOnly,
  origemFilter,
  responsavelFilter,
  statusFilter,
  sortBy,
  page,
  loading,
  totalLeads,
  filteredCount,
  pageSize,
  responsavelOptions,
  hasActiveFilters,
  onSearchChange,
  onBlockedOnlyChange,
  onInconsistentOnlyChange,
  onOrigemFilterChange,
  onResponsavelFilterChange,
  onStatusFilterChange,
  onSortByChange,
  onPageChange,
  onClearFilters,
  onExportCsv,
}: PipelineFiltersProps) {
  return (
    <section className="rounded-2xl border border-border/50 bg-card/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Filtros</p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-[11px] text-primary hover:underline cursor-pointer"
            >
              Limpar filtros
            </button>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {filteredCount} de {totalLeads} leads · Pág. {page}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        <div className="relative lg:col-span-2">
          <Input
            placeholder="Buscar escritório, origem ou resp..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-8 text-xs pl-3"
            aria-label="Buscar leads"
          />
        </div>

        <select
          aria-label="Filtrar por status"
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs cursor-pointer"
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as 'all' | CommercialLeadStatus)}
        >
          <option value="all">Status: Todos</option>
          {COLUMNS.map((col) => <option key={col.key} value={col.key}>{col.label}</option>)}
        </select>

        <select
          aria-label="Filtrar por origem"
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs cursor-pointer"
          value={origemFilter}
          onChange={(event) => onOrigemFilterChange(event.target.value as OrigemFilter)}
        >
          <option value="all">Origem: Todas</option>
          <option value="instagram">Instagram</option>
          <option value="indicacao">Indicação</option>
          <option value="site">Site</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="outro">Outro</option>
        </select>

        <select
          aria-label="Filtrar por responsável"
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs cursor-pointer"
          value={responsavelFilter}
          onChange={(event) => onResponsavelFilterChange(event.target.value)}
        >
          <option value="all">Responsável: Todos</option>
          {responsavelOptions.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onBlockedOnlyChange((previous) => !previous)}
            className={cn(
              'h-7 px-2 rounded-lg border text-[11px] transition-colors cursor-pointer',
              blockedOnly ? 'border-amber-500/60 text-amber-300 bg-amber-500/10' : 'border-border text-muted-foreground hover:border-border/80',
            )}
          >
            {blockedOnly ? '× Bloqueados ON' : 'Bloqueados'}
          </button>
          <button
            type="button"
            onClick={() => onInconsistentOnlyChange((previous) => !previous)}
            className={cn(
              'h-7 px-2 rounded-lg border text-[11px] transition-colors cursor-pointer',
              inconsistentOnly ? 'border-rose-500/60 text-rose-300 bg-rose-500/10' : 'border-border text-muted-foreground hover:border-border/80',
            )}
          >
            {inconsistentOnly ? '× Inconsistentes ON' : 'Inconsistentes'}
          </button>
          <select
            aria-label="Ordenação"
            className="h-7 rounded-lg border border-input bg-transparent px-2 text-[11px] cursor-pointer"
            value={sortBy}
            onChange={(event) => onSortByChange(event.target.value as 'updated_desc' | 'name_asc')}
          >
            <option value="updated_desc">Mais recente</option>
            <option value="name_asc">Nome A-Z</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px] cursor-pointer"
            disabled={filteredCount === 0}
            onClick={onExportCsv}
          >
            <Download className="h-3 w-3 mr-1" /> CSV
          </Button>
          <Button
            aria-label="Página anterior"
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0 cursor-pointer"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange((previous) => Math.max(1, previous - 1))}
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            aria-label="Próxima página"
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0 cursor-pointer"
            disabled={loading || totalLeads < pageSize}
            onClick={() => onPageChange((previous) => previous + 1)}
          >
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}

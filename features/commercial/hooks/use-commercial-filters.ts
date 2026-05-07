'use client';

import { useEffect, useState } from 'react';

import type { CommercialLeadStatus } from '@/lib/api/client/commercial';

export function useCommercialFilters() {
  const [search, setSearch] = useState('');
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [inconsistentOnly, setInconsistentOnly] = useState(false);
  const [origemFilter, setOrigemFilter] = useState<'all' | 'instagram' | 'indicacao' | 'site' | 'whatsapp' | 'outro'>('all');
  const [responsavelFilter, setResponsavelFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CommercialLeadStatus>('all');
  const [kpiRange, setKpiRange] = useState<'all' | 7 | 30>('all');
  const [sortBy, setSortBy] = useState<'updated_desc' | 'name_asc'>('updated_desc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    queueMicrotask(() => setPage(1));
  }, [statusFilter, responsavelFilter, origemFilter, search, blockedOnly, inconsistentOnly]);

  return {
    blockedOnly,
    inconsistentOnly,
    kpiRange,
    origemFilter,
    page,
    responsavelFilter,
    search,
    setBlockedOnly,
    setInconsistentOnly,
    setKpiRange,
    setOrigemFilter,
    setPage,
    setResponsavelFilter,
    setSearch,
    setSortBy,
    setStatusFilter,
    sortBy,
    statusFilter,
  };
}

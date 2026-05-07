import type {
  CommercialLead,
  CommercialLeadStatus,
} from '@/lib/api/client/commercial';

export type PendingTransition = { lead: CommercialLead; to: 'nutricao' | 'perdido' };
export type ConcluirDiagLead = CommercialLead;
export type ComercialErrorAction =
  | { type: 'send_scheduling_invite'; leadId: string }
  | { type: 'run_calendar_sync'; leadId: string }
  | { type: 'configure_calendar'; leadId: string }
  | null;

export type CommercialLeadFilters = {
  statusFilter: 'all' | CommercialLeadStatus;
  origemFilter: 'all' | 'instagram' | 'indicacao' | 'site' | 'whatsapp' | 'outro';
  responsavelFilter: 'all' | string;
  search: string;
  sortBy: 'updated_desc' | 'name_asc';
  blockedOnly: boolean;
  inconsistentOnly: boolean;
};

export type UnifiedTimelineItem = {
  id: string;
  type: 'transition' | 'integration';
  at: string;
  title: string;
  subtitle?: string;
};

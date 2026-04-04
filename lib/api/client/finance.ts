import { apiClient } from './http';

export type Contract = {
  id: string;
  clientId: string;
  status: 'draft' | 'pending_signature' | 'active' | 'expired' | 'cancelled';
  serviceType: string;
  title: string;
  startDate: string;
  endDate: string | null;
  billingCycle: string;
  currency: string;
  amount: number | string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    status: string;
  };
  openReceivables?: number;
  overdueReceivables?: number;
};

export type Receivable = {
  id: string;
  clientId: string;
  contractId: string;
  referenceLabel: string;
  dueDate: string;
  amount: number | string;
  status: 'scheduled' | 'issued' | 'paid' | 'overdue' | 'suspended';
  issuedAt: string | null;
  paidAt: string | null;
  client: {
    id: string;
    name: string;
  };
  contract: {
    id: string;
    title: string;
  };
  payments?: PaymentRecord[];
};

export type PaymentRecord = {
  id: string;
  amount: number | string;
  paidAt: string;
  paymentMethod?: string | null;
  reference?: string | null;
};

export type RenewalOpportunity = {
  id: string;
  clientId: string;
  contractId: string;
  status: 'open' | 'overdue' | 'won' | 'lost';
  dueDate: string;
  healthStatus?: string | null;
  notes?: string | null;
  client: {
    id: string;
    name: string;
  };
  contract: {
    id: string;
    title: string;
    endDate: string | null;
  };
};

export type CreateContractInput = {
  clientId: string;
  title?: string;
  serviceType?: string;
  startDate?: string;
  endDate?: string | null;
  billingCycle?: string;
  currency?: string;
  amount?: number | null;
};

export type RecordPaymentInput = {
  amount: number;
  paidAt?: string;
  paymentMethod?: string | null;
  reference?: string | null;
  notes?: string | null;
};

export async function listContracts(params?: { clientId?: string; status?: string }) {
  const { data } = await apiClient.get<Contract[]>('/api/contracts', params ? { params } : undefined);
  return data;
}

export async function createContract(payload: CreateContractInput) {
  const { data } = await apiClient.post<Contract>('/api/contracts', payload);
  return data;
}

export async function activateContract(contractId: string) {
  const { data } = await apiClient.post<Contract>(`/api/contracts/${contractId}/activate`);
  return data;
}

export async function backfillContracts() {
  const { data } = await apiClient.post<{ success: true; created: number; totalClients: number }>('/api/contracts/backfill');
  return data;
}

export async function listReceivables(params?: { clientId?: string; status?: string }) {
  const { data } = await apiClient.get<Receivable[]>('/api/receivables', params ? { params } : undefined);
  return data;
}

export async function recordPayment(receivableId: string, payload: RecordPaymentInput) {
  const { data } = await apiClient.post<Receivable>(`/api/receivables/${receivableId}/payments`, payload);
  return data;
}

export async function listRenewals(params?: { clientId?: string; status?: string }) {
  const { data } = await apiClient.get<RenewalOpportunity[]>('/api/renewals', params ? { params } : undefined);
  return data;
}

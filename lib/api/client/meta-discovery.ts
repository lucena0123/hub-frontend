import { apiClient } from './http';

export type MetaAdAccount = {
  id: string;
  accountId: string;
  name?: string;
  status?: number | string;
  currency?: string;
  timezone?: string;
  businessName?: string;
  amountSpent?: string;
  spendCap?: string;
};

export type MetaAdAccountsResponse = {
  total: number;
  accounts: MetaAdAccount[];
};

export const listMetaAdAccounts = async (): Promise<MetaAdAccountsResponse> => {
  const { data } = await apiClient.get<MetaAdAccountsResponse>('/api/meta/accounts');
  return data;
};


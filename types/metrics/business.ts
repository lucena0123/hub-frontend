export interface BusinessMetricsData {
  totalSpend: number;
  totalConversations: number;
  totalContracts: number;
  totalRevenue: number;
  avgTicket: number;
  cac: number;
  costPerLead: number;
  conversionRate: number;
  ltv: number;
  ltvCacRatio: number;
  ltvCacHealth: string;
  roi: number;
  config: {
    lifetimeMonths: number;
    monthlyRevenue: number;
  };
}

export interface BusinessMetricsResponse extends BusinessMetricsData {
  campaignId: string;
}


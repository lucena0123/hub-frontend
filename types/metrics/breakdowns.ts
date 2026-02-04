export interface BreakdownSegment {
  label: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  conversions: number;
  ctr: number;
  cpm: number;
  shareOfSpend: number;
}

export interface BreakdownResponse {
  campaignId: string;
  breakdownType: string;
  total: number;
  segments: BreakdownSegment[];
}


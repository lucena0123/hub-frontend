export interface TemporalDayOfWeekData {
  dayOfWeek: number;
  dayName: string;
  totalImpressions: number;
  totalClicks: number;
  totalSpend: number;
  totalConversions: number;
  totalConversations: number;
  avgCtr: number;
  avgCpm: number;
  cpl: number;
  daysCount: number;
}

export interface TemporalAnalysisResponse {
  campaignId: string;
  byDayOfWeek: TemporalDayOfWeekData[];
  bestDay: string | null;
  worstDay: string | null;
  cheapestDay: string | null;
  mostExpensiveDay: string | null;
}


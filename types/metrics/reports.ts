import type { ClientPerformanceSummary } from './campaign';

export interface MonthlyReport {
  id: string;
  clientId: string;
  reportType: 'monthly' | 'weekly' | 'quarterly' | 'custom';
  periodStart: string;
  periodEnd: string;
  title: string;
  summaryData: {
    performance: ClientPerformanceSummary;
    insights: string[];
    recommendations: string[];
    highlights: string[];
  };
  filePath?: string;
  fileSize?: number;
  pdfUrl?: string;
  generatedBy?: string;
  generatedAt: string;
  version: number;
  status: 'generating' | 'generated' | 'failed';
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}


import axios from 'axios';

import type { MetricsPeriod, MetricsQuery } from '@/types';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

export const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (isRecord(data) && typeof data.message === 'string') return data.message;
    if (typeof data === 'string' && data.toLowerCase().includes('<html')) {
      return 'API retornou HTML em vez de JSON. Verifique NEXT_PUBLIC_API_URL e se o backend Fastify está rodando.';
    }
  }

  if (err instanceof Error) return err.message;
  return fallback;
};

const shiftIsoDateUtc = (isoDate: string, days: number) => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
};

export const getDateRangeFromPeriod = (value: MetricsPeriod): { startDate: string; endDate: string } => {
  const end = new Date();
  const start = new Date();

  switch (value) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '14d':
      start.setDate(end.getDate() - 14);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '60d':
      start.setDate(end.getDate() - 60);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    default:
      start.setDate(end.getDate() - 30);
  }

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
};

export const resolveMetricsRange = (query: MetricsQuery, fallbackPeriod: MetricsPeriod): { startDate: string; endDate: string } => {
  if (query.startDate && query.endDate) return { startDate: query.startDate, endDate: query.endDate };

  const resolvedPeriod: MetricsPeriod = query.period && query.period !== 'custom' ? query.period : fallbackPeriod;

  if (resolvedPeriod !== 'custom') return getDateRangeFromPeriod(resolvedPeriod);
  return getDateRangeFromPeriod('30d');
};

export const getLastWeekRange = (query: MetricsQuery, fallbackPeriod: MetricsPeriod): { startDate: string; endDate: string } => {
  const range = resolveMetricsRange(query, fallbackPeriod);
  const endDate = range.endDate;
  const startDateBase = shiftIsoDateUtc(endDate, -6);
  const startDate = startDateBase < range.startDate ? range.startDate : startDateBase;
  return { startDate, endDate };
};


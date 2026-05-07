import type { CampaignBenchmark } from '@/types';

export const getStepRate = (numerator: number, denominator: number) => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
  return (numerator / denominator) * 100;
};

export const resolveInsight = (params: {
  ctr: number;
  cpl: number;
  conversionRate: number;
  clickToLpRate: number | null;
  lpToConvRate: number | null;
  benchmark?: CampaignBenchmark;
}) => {
  const { ctr, cpl, conversionRate, clickToLpRate, lpToConvRate, benchmark } = params;
  const ctrBaseline = benchmark?.baseline?.ctrP25 ?? benchmark?.baseline?.ctrMedian ?? null;
  const cplBaseline = benchmark?.baseline?.cplP75 ?? benchmark?.baseline?.cplMedian ?? null;

  if (ctrBaseline && ctr > 0 && ctr < ctrBaseline) {
    return 'CTR abaixo do baseline: provável problema de criativo ou audiência.';
  }
  if (cplBaseline && cpl > 0 && cpl > cplBaseline) {
    return 'CPL acima do baseline: ajuste de segmentação ou oferta.';
  }
  if (clickToLpRate !== null && clickToLpRate < 20) {
    return 'Baixa taxa de LP Views: possível lentidão ou tracking da página.';
  }
  if (lpToConvRate !== null && lpToConvRate < 5) {
    return 'Conversão baixa após LP: revisar página, oferta e formulário.';
  }
  if (conversionRate > 0 && conversionRate < 2) {
    return 'Conversão baixa: revisar funil e qualificação.';
  }
  return 'Dentro do esperado para o período.';
};

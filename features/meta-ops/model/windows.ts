import type { OpsBucket, OpsItem } from './types';

export const windowsBySource = (
  source: OpsItem['source'],
  description: string,
  bucket?: OpsBucket,
  hinted?: {
    analysisWindow?: string;
    learningWindow?: string;
    learningWindowBasis?: 'since_start' | 'since_reset' | 'mixed' | 'unknown';
  }
): Pick<OpsItem, 'analysisWindow' | 'learningWindow' | 'learningWindowBasis'> => {
  if (hinted?.analysisWindow || hinted?.learningWindow) {
    return {
      analysisWindow: hinted.analysisWindow ?? 'Acumulado (métrica consolidada da campanha)',
      learningWindow: hinted.learningWindow ?? 'Aprendizado (start/reset não explícito; validar na tela de Performance)',
      learningWindowBasis: hinted.learningWindowBasis ?? 'unknown',
    };
  }

  if (source === 'alert') {
    const hasStartResetHint = /start|reset/i.test(description);
    return {
      analysisWindow: 'Acumulado (métrica consolidada da campanha)',
      learningWindow: hasStartResetHint
        ? 'Aprendizado (start/reset explícito no dado)'
        : 'Aprendizado (start/reset não explícito; validar na tela de Performance)',
      learningWindowBasis: hasStartResetHint ? 'mixed' : 'unknown',
    };
  }

  if (source === 'proposal') {
    if (bucket === 'creative_copy') {
      return {
        analysisWindow: 'Operacional atual de criativo/copy (priorização do ciclo atual)',
        learningWindow: 'Aprendizado depende da próxima janela pós-implementação (24h/48h)',
        learningWindowBasis: 'unknown',
      };
    }

    if (bucket === 'audience') {
      return {
        analysisWindow: 'Operacional atual de segmentação (sinal do ciclo atual)',
        learningWindow: 'Aprendizado depende da próxima janela pós-ajuste de público (24h/48h)',
        learningWindowBasis: 'unknown',
      };
    }

    return {
      analysisWindow: 'Operacional atual de orçamento/escala (ciclo vigente)',
      learningWindow: 'Aprendizado depende da próxima janela pós-ajuste de verba (24h/48h)',
      learningWindowBasis: 'unknown',
    };
  }

  return {
    analysisWindow: 'Operacional atual (item de proposta)',
    learningWindow: 'Sem base de aprendizado no item; validar start/reset na tela de Performance',
    learningWindowBasis: 'unknown',
  };
};

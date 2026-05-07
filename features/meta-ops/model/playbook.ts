import type { OpsBucket, OpsItem } from './types';

export const ruleSuggestionByBucket = (
  bucket: OpsBucket,
  priority: OpsItem['priority']
): { ruleId: string; parameters: Record<string, unknown>; rationale: string } => {
  if (bucket === 'creative_copy') {
    return {
      ruleId: 'creative.fatigued',
      parameters: {
        frequencyThreshold: priority === 'critical' ? 2.1 : 2.4,
        windowDays: 5,
      },
      rationale: 'Ajuste para detectar fadiga criativa mais cedo quando necessário.',
    };
  }

  if (bucket === 'audience') {
    return {
      ruleId: 'campaign.no-contacts',
      parameters: {
        minSpend: priority === 'critical' ? 28 : 35,
        windowDays: 2,
      },
      rationale: 'Antecipar alerta de falta de contatos para reagir no mesmo ciclo.',
    };
  }

  return {
    ruleId: 'campaign.cpl-high',
    parameters: {
      cplThreshold: priority === 'critical' ? 16 : 18,
      windowDays: 3,
    },
    rationale: 'Ajustar limiar de CPL para cortar desperdício mais cedo.',
  };
};

export const buildPlaybook = (item: {
  title: string;
  priority: OpsItem['priority'];
  bucket: OpsBucket;
  clientName: string;
}) => {
  const hook = item.priority === 'critical' ? 'Ação imediata' : item.priority === 'warning' ? 'Atenção' : 'Oportunidade';
  const copyText = `${hook}: ${item.title}.\nSe isso está acontecendo com você, fale agora com nossa equipe jurídica no WhatsApp e receba orientação especializada.`;

  const imageSuggestion =
    item.bucket === 'creative_copy'
      ? 'Use vídeo vertical 9:16 com advogado(a) em câmera, texto grande no início e CTA WhatsApp no final.'
      : item.bucket === 'audience'
        ? 'Use criativo com dor específica do público + prova de autoridade (especialista + tema jurídico).'
        : 'Use criativo simples com headline de benefício e reforço de urgência (sem poluição visual).';

  const audienceSuggestion =
    item.bucket === 'audience'
      ? `Público sugerido: base ${item.clientName} + lookalike 1% de conversões + interesses jurídicos do tema da campanha.`
      : 'Público sugerido: manter conjunto atual e abrir 1 variação com interesse correlato para teste A/B.';

  const budgetSuggestion =
    item.priority === 'critical'
      ? 'Orçamento sugerido: reduzir 15% no conjunto crítico e realocar para criativo novo por 24h.'
      : item.priority === 'warning'
        ? 'Orçamento sugerido: ajuste fino de 10% (sem escalar no mesmo dia da troca criativa).'
        : 'Orçamento sugerido: manter e escalar +10% apenas se CPL/conversas melhorarem em 24h.';

  return { copyText, imageSuggestion, audienceSuggestion, budgetSuggestion };
};

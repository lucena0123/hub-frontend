export type OpsBucket = 'creative_copy' | 'audience' | 'budget_scale';

export type OpsItem = {
  id: string;
  clientId: string;
  clientName: string;
  campaignName: string;
  creativeName: string;
  title: string;
  description: string;
  source: 'alert' | 'proposal';
  priority: 'critical' | 'warning' | 'info';
  bucket: OpsBucket;
  evidence: string;
  successCriterion: string;
  confidence: 'alta' | 'média';
  copyText: string;
  imageSuggestion: string;
  audienceSuggestion: string;
  budgetSuggestion: string;
  relatedEvidence: string[];
  analysisWindow: string;
  learningWindow: string;
  learningWindowBasis?: 'since_start' | 'since_reset' | 'mixed' | 'unknown';
};

export type OpsStatus =
  | 'pendente'
  | 'em_execucao'
  | 'implementado'
  | 'validado_ganhou'
  | 'validado_neutro'
  | 'validado_piorou';

export type CheckpointFilter = 'all' | 'ready24' | 'ready48' | 'pending' | 'mandatory';

export type StatusHistoryEntry = { status: OpsStatus; at: string };

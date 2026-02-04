import type { Client } from '@/types';

export type ClientCampaign = {
  id: string;
  name: string;
  status?: string;
  platform?: string;
  budget?: number;
  spent?: number;
  externalId?: string;
};

export type ClientProcess = {
  id: string;
  processId: string;
  status: string;
  priority?: number;
  startedAt?: string;
  completedAt?: string;
  currentPhase?: string | null;
  currentTask?: string | null;
};

export type ClientDetails = Client & {
  campaigns?: ClientCampaign[];
  processes?: ClientProcess[];
  _count?: {
    processes?: number;
    campaigns?: number;
    metrics?: number;
  };
};


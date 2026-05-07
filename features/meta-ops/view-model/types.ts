import type { OpsItem } from '../model';

export type CheckpointState = {
  ready24: boolean;
  ready48: boolean;
  pending: boolean;
};

export type ClientGroup = {
  clientId: string;
  clientName: string;
  items: OpsItem[];
};

export type MandatoryClientGroup = {
  clientId: string;
  clientName: string;
  total: number;
  ready48: number;
};

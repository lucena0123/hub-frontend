import { apiClient } from './http';

export type Milestone = {
  id: string;
  projectId: string;
  name: string;
  status: 'planned' | 'active' | 'blocked' | 'done' | 'cancelled';
  orderIndex: number;
  dueDate: string | null;
};

export type Deliverable = {
  id: string;
  projectId: string;
  milestoneId: string | null;
  name: string;
  description?: string | null;
  status: 'planned' | 'active' | 'blocked' | 'done' | 'cancelled';
  blockedReason?: string | null;
  dueDate: string | null;
};

export type WorkItem = {
  id: string;
  projectId: string;
  deliverableId: string | null;
  title: string;
  status: string;
  assignee?: string | null;
  priority: string;
  dueDate: string | null;
};

export type Project = {
  id: string;
  clientId: string;
  contractId: string | null;
  name: string;
  serviceType: string;
  status: 'planned' | 'active' | 'blocked' | 'done' | 'cancelled';
  ownerUserId?: string | null;
  startDate: string;
  dueDate: string | null;
  client: {
    id: string;
    name: string;
  };
  contract?: {
    id: string;
    title: string;
  } | null;
  milestones?: Milestone[];
  deliverables?: Deliverable[];
  workItems?: WorkItem[];
};

export type CreateProjectInput = {
  clientId: string;
  contractId?: string | null;
  name?: string;
  serviceType?: string;
  dueDate?: string | null;
};

export async function listProjects(params?: { clientId?: string; status?: string }) {
  const { data } = await apiClient.get<Project[]>('/api/projects', params ? { params } : undefined);
  return data;
}

export async function getProject(projectId: string) {
  const { data } = await apiClient.get<Project>(`/api/projects/${projectId}`);
  return data;
}

export async function createProject(payload: CreateProjectInput) {
  const { data } = await apiClient.post<Project>('/api/projects', payload);
  return data;
}

export async function createMilestone(projectId: string, payload: { name: string; dueDate?: string | null }) {
  const { data } = await apiClient.post<Milestone>(`/api/projects/${projectId}/milestones`, payload);
  return data;
}

export async function listDeliverables(params?: { projectId?: string; status?: string }) {
  const { data } = await apiClient.get<Deliverable[]>('/api/deliverables', params ? { params } : undefined);
  return data;
}

export async function createDeliverable(payload: { projectId: string; milestoneId?: string | null; name: string; description?: string | null; dueDate?: string | null }) {
  const { data } = await apiClient.post<Deliverable>('/api/deliverables', payload);
  return data;
}

export async function updateDeliverable(deliverableId: string, payload: { status?: string; blockedReason?: string | null }) {
  const { data } = await apiClient.patch<Deliverable>(`/api/deliverables/${deliverableId}`, payload);
  return data;
}

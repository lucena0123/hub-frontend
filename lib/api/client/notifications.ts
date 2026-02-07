import { apiClient } from './http';

export interface Notification {
  id: string;
  clientId: string | null;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export interface NotificationsResponse {
  total: number;
  notifications: Notification[];
}

export async function listNotifications(params?: {
  clientId?: string;
  read?: boolean;
  limit?: number;
  offset?: number;
}) {
  const response = await apiClient.get<NotificationsResponse>('/api/notifications', { params });
  return response.data;
}

export async function getUnreadCount(clientId?: string) {
  const response = await apiClient.get<{ count: number }>('/api/notifications/unread-count', {
    params: clientId ? { clientId } : undefined,
  });
  return response.data.count;
}

export async function markNotificationAsRead(id: string) {
  await apiClient.post(`/api/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead(clientId?: string) {
  await apiClient.post('/api/notifications/mark-all-read', null, {
    params: clientId ? { clientId } : undefined,
  });
}

import type { AuthResponse, LoginPayload, RegisterPayload, User } from '@/types/auth';

import { apiClient } from './http';

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/login', payload);
  return data;
};

export const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/register', payload);
  return data;
};

export const getMe = async (): Promise<User> => {
  const { data } = await apiClient.get<User>('/api/auth/me');
  return data;
};

export const updateProfile = async (payload: { name: string }): Promise<User> => {
  const { data } = await apiClient.put<User>('/api/auth/profile', payload);
  return data;
};

export const changePassword = async (payload: { oldPassword: string; newPassword: string }) => {
  const { data } = await apiClient.put<{ success: boolean }>('/api/auth/password', payload);
  return data;
};

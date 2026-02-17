import axios from 'axios';

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const payload = error.response?.data as
    | { message?: string; error?: string; code?: string }
    | undefined;

  if (payload?.message) return payload.message;
  if (payload?.error) return payload.error;
  if (payload?.code) return payload.code;
  if (error.message) return error.message;

  return fallback;
};

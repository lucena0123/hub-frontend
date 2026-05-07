import { AxiosError } from 'axios';

export const toApiError = (err: unknown, fallback: string): string => {
  if (err instanceof AxiosError) {
    const payload = err.response?.data as { message?: string } | undefined;
    if (payload?.message) return payload.message;
  }
  return fallback;
};

export const toApiErrorWithReason = (
  err: unknown,
  fallback: string,
): { message: string; reasonCode?: string; details?: Record<string, unknown> } => {
  if (err instanceof AxiosError) {
    const payload = err.response?.data as { message?: string; details?: Record<string, unknown> & { reasonCode?: string } } | undefined;
    return {
      message: payload?.message || fallback,
      reasonCode: payload?.details?.reasonCode,
      details: payload?.details,
    };
  }

  return { message: fallback };
};

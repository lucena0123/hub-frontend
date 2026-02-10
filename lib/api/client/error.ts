export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null) {
    const maybe = error as {
      response?: {
        data?: {
          error?: unknown;
          message?: unknown;
        };
      };
      message?: unknown;
    };

    const responseData = maybe.response?.data;
    if (typeof responseData?.error === 'string' && responseData.error.trim()) {
      return responseData.error;
    }
    if (typeof responseData?.message === 'string' && responseData.message.trim()) {
      return responseData.message;
    }

    if (typeof maybe.message === 'string' && maybe.message.trim()) {
      return maybe.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};


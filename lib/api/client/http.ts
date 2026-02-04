import axios from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const API_TIMEOUT_MS = (() => {
  const raw = process.env.NEXT_PUBLIC_API_TIMEOUT_MS;
  if (!raw) return 30000;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 30000;
})();

const looksLikeHtmlDocument = (value: string) => {
  const trimmed = value.trimStart().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html') || trimmed.includes('<html');
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string' && looksLikeHtmlDocument(response.data)) {
      throw new Error(
        `API returned HTML instead of JSON. Check NEXT_PUBLIC_API_URL (currently: ${API_BASE_URL}) and ensure the Fastify backend is running.`
      );
    }

    return response;
  },
  (error) => Promise.reject(error)
);


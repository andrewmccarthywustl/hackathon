const sanitizeBaseUrl = (value: string) => value.replace(/\/$/, '');

const fallbackBaseUrl = import.meta.env.MODE === 'development'
  ? 'http://localhost:3001'
  : 'https://hackathon-production-eead.up.railway.app';
const rawBaseUrl = typeof import.meta.env.VITE_API_BASE_URL === 'string'
  ? import.meta.env.VITE_API_BASE_URL
  : undefined;

const resolvedBaseUrl = rawBaseUrl?.trim();
const effectiveBaseUrl =
  resolvedBaseUrl !== undefined
    ? resolvedBaseUrl
    : fallbackBaseUrl;

export const API_BASE_URL = effectiveBaseUrl === '' ? '' : sanitizeBaseUrl(effectiveBaseUrl);

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) {
    return normalizedPath;
  }
  return `${API_BASE_URL}${normalizedPath}`;
}

export function apiFetch(path: string, init?: RequestInit) {
  return fetch(apiUrl(path), init);
}

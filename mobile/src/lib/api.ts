import { getToken } from './tokenStorage';

// Base URL of the calorie-tracker API server.
// - iOS simulator / web: http://localhost:4000 works out of the box.
// - Android emulator: localhost maps to the emulator itself, use 10.0.2.2 instead.
// - Physical device: use your computer's LAN IP, e.g. http://192.168.1.20:4000.
// Override via EXPO_PUBLIC_API_URL in mobile/.env.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new ApiError(response.status, data.error ?? 'Something went wrong. Please try again.');
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: { auth?: boolean }) =>
    request<T>(path, { method: 'POST', body, auth: options?.auth ?? true }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

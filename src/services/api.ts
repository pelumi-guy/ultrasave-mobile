import type { Preferences, RemoteSource, ServerJob } from '../types';
import { getToken } from '../storage/secrets';
export class ApiError extends Error { constructor(public code: string, message: string) { super(message); } }
export async function request<T>(settings: Preferences, path: string, body?: unknown, method?: string, candidateToken?: string): Promise<T> {
  const token = candidateToken ?? await getToken();
  if (!token) throw new ApiError('CONFIGURATION', 'Add your private backend access token in Settings.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${settings.backendUrl.replace(/\/$/, '')}${path}`, {
      method: method ?? (body === undefined ? 'GET' : 'POST'), signal: controller.signal,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new ApiError(result.error?.code ?? 'SERVER_ERROR', result.error?.message ?? 'The backend could not complete that request.');
    return result as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('NETWORK', 'Cannot reach your backend. Check its address, token and network, then retry.');
  } finally { clearTimeout(timeout); }
}
export const createRemoteJob = (settings: Preferences, source: RemoteSource, url: string, key: string, fixture?: string) => request<ServerJob>(settings, '/v1/jobs', { source, url, idempotency_key: key, fixture });
export const getRemoteJob = (settings: Preferences, id: string) => request<ServerJob>(settings, `/v1/jobs/${encodeURIComponent(id)}`);
export const findRemoteRequest = (settings: Preferences, key: string) => request<{ id: string }>(settings, `/v1/requests/${encodeURIComponent(key)}`);

import type { Database } from './model';
export class RequestError extends Error {
  fields: Record<string, string>;
  constructor(message: string, fields: Record<string, string> = {}) {
    super(message);
    this.fields = fields;
  }
}
export async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch('/api' + path, {
      method,
      headers: body ? {
        'Content-Type': 'application/json'
      } : {},
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new RequestError('Connection lost. Check that the local server is running.');
  }
  if (response.status === 204) return undefined as T;
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) throw new RequestError(result?.error?.message || 'Could not load checkpoint records.', result?.error?.fields);
  return result.data;
}
export const loadState = () => request<Database>('/state');

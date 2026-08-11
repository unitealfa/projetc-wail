import { sessionStorage } from '../storage/sessionStorage';

interface SuccessResponse<T> {
  success: true;
  data: T;
}

interface ErrorResponse {
  success: false;
  message?: string;
  code?: string;
  details?: unknown;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

let unauthorizedHandler: (() => void | Promise<void>) | null = null;

export function registerUnauthorizedHandler(handler: (() => void | Promise<void>) | null): void {
  unauthorizedHandler = handler;
}

function getBaseUrl(): string {
  const value = process.env.EXPO_PUBLIC_SERVER_URL?.trim();
  if (!value) {
    throw new ApiClientError('EXPO_PUBLIC_SERVER_URL n’est pas configurée.', 0, 'MISSING_SERVER_URL');
  }
  return value.replace(/\/+$/, '');
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  json?: unknown;
  formData?: FormData;
  authenticated?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.authenticated !== false) {
    const token = await sessionStorage.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.json);
  }

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body,
    });
  } catch {
    throw new ApiClientError('Impossible de contacter le serveur.', 0, 'NETWORK_ERROR');
  }

  let payload: SuccessResponse<T> | ErrorResponse | null = null;
  try {
    payload = (await response.json()) as SuccessResponse<T> | ErrorResponse;
  } catch {
    // Une réponse non JSON est transformée en erreur lisible ci-dessous.
  }

  if (!response.ok || !payload || payload.success !== true) {
    if (response.status === 401 && unauthorizedHandler) await unauthorizedHandler();
    const errorPayload = payload && payload.success === false ? payload : null;
    throw new ApiClientError(
      errorPayload?.message ?? `Erreur serveur (${response.status}).`,
      response.status,
      errorPayload?.code,
      errorPayload?.details,
    );
  }
  return payload.data;
}

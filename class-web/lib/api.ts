import type { User, Category, Memo, Repeat } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8001/api';

const ACCESS_KEY = 'pm_access';
const REFRESH_KEY = 'pm_refresh';

export class AuthError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthError';
  }
}

export function getAccess(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefresh(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh?: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACCESS_KEY, access);
  if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

type ApiInit = RequestInit & { auth?: boolean };

function buildHeaders(init: ApiInit, token: string | null): Headers {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (init.auth !== false && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

function extractErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.detail === 'string') return obj.detail;
    for (const v of Object.values(obj)) {
      if (typeof v === 'string') return v;
      if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'string') return v[0];
    }
  }
  if (typeof data === 'string' && data) return data;
  return fallback;
}

async function tryRefresh(): Promise<string | null> {
  const refresh = getRefresh();
  if (!refresh) return null;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access?: string };
    if (!data.access) return null;
    setTokens(data.access);
    return data.access;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(path: string, init: ApiInit = {}): Promise<T> {
  const useAuth = init.auth !== false;
  const token = useAuth ? getAccess() : null;
  const headers = buildHeaders(init, token);

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (res.status === 401 && useAuth) {
    const newAccess = await tryRefresh();
    if (!newAccess) {
      clearTokens();
      throw new AuthError();
    }
    const retryHeaders = buildHeaders(init, newAccess);
    const retry = await fetch(`${BASE_URL}${path}`, { ...init, headers: retryHeaders });
    if (retry.status === 401) {
      clearTokens();
      throw new AuthError();
    }
    return parseResponse<T>(retry);
  }

  return parseResponse<T>(res);
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, `요청에 실패했습니다 (${res.status})`));
  }
  return data as T;
}

type AuthTokens = { access: string; refresh: string };
type SignupResponse = { user: User } & AuthTokens;

export async function signup(
  email: string,
  name: string,
  password: string,
): Promise<SignupResponse> {
  const data = await apiFetch<SignupResponse>('/auth/signup/', {
    method: 'POST',
    body: JSON.stringify({ email, name, password }),
    auth: false,
  });
  setTokens(data.access, data.refresh);
  return data;
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const data = await apiFetch<AuthTokens>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    auth: false,
  });
  setTokens(data.access, data.refresh);
  return data;
}

export function me(): Promise<User> {
  return apiFetch<User>('/auth/me/');
}

export function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>('/categories/');
}

export function createCategory(payload: { name: string; emoji?: string }): Promise<Category> {
  return apiFetch<Category>('/categories/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteCategory(id: number): Promise<void> {
  return apiFetch<void>(`/categories/${id}/`, { method: 'DELETE' });
}

export function updateCategory(
  id: number,
  partial: Partial<Pick<Category, 'name' | 'emoji'>>,
): Promise<Category> {
  return apiFetch<Category>(`/categories/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(partial),
  });
}

export function mergeCategory(
  sourceId: number,
  targetId: number,
): Promise<{ moved: number; target: Category; detail: string }> {
  return apiFetch(`/categories/${sourceId}/merge/`, {
    method: 'POST',
    body: JSON.stringify({ target_id: targetId }),
  });
}

export function deleteAccount(password: string): Promise<void> {
  return apiFetch<void>('/auth/me/', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  });
}

export function getMemos(): Promise<Memo[]> {
  return apiFetch<Memo[]>('/memos/');
}

export function createMemo(payload: {
  category_name: string;
  memo: string;
  alarm_date?: string | null;
  repeat?: Repeat;
  tag?: string[];
}): Promise<Memo> {
  return apiFetch<Memo>('/memos/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateMemo(id: number, partial: Partial<Memo>): Promise<Memo> {
  return apiFetch<Memo>(`/memos/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(partial),
  });
}

export function getTrash(): Promise<Memo[]> {
  return apiFetch<Memo[]>('/memos/trash/');
}

export function restoreMemo(id: number): Promise<Memo> {
  return apiFetch<Memo>(`/memos/${id}/restore/`, { method: 'POST' });
}

export function forceDeleteMemo(id: number): Promise<void> {
  return apiFetch<void>(`/memos/${id}/?force=1`, { method: 'DELETE' });
}

export function emptyTrash(): Promise<{ deleted: number }> {
  return apiFetch('/memos/empty_trash/', { method: 'POST' });
}

export function bulkImportMemos(
  memos: Array<{
    category_name: string;
    memo: string;
    alarm_date?: string | null;
    tag?: string[];
  }>,
): Promise<{ imported: number; errors: Array<{ row: number; message: string }> }> {
  return apiFetch('/memos/bulk_import/', {
    method: 'POST',
    body: JSON.stringify({ memos, auto_create_categories: true }),
  });
}

export function deleteMemo(id: number): Promise<void> {
  return apiFetch<void>(`/memos/${id}/`, { method: 'DELETE' });
}

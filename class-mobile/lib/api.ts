import * as SecureStore from 'expo-secure-store';
import type { Category, Memo, User } from './types';

const ACCESS_KEY = 'pm_access';
const REFRESH_KEY = 'pm_refresh';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
if (!BASE_URL) {
  throw new Error(
    'EXPO_PUBLIC_API_URL is not defined. Set it in .env (e.g. EXPO_PUBLIC_API_URL=http://127.0.0.1:8001/api).',
  );
}

export class AuthError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthError';
  }
}

export async function getAccess(): Promise<string | null> {
  return await SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefresh(): Promise<string | null> {
  return await SecureStore.getItemAsync(REFRESH_KEY);
}

export async function setTokens(access: string, refresh?: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_KEY, access);
  if (refresh !== undefined) {
    await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  }
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

function joinUrl(path: string): string {
  if (path.startsWith('http')) return path;
  const base = BASE_URL!.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

function firstErrorMessage(payload: unknown, fallback: string): string {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (typeof payload !== 'object') return fallback;
  const obj = payload as Record<string, unknown>;
  if (typeof obj.detail === 'string') return obj.detail;
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (typeof v === 'string') return v;
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'string') return v[0] as string;
  }
  return fallback;
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function refreshAccess(): Promise<string | null> {
  const refresh = await getRefresh();
  if (!refresh) return null;
  const res = await fetch(joinUrl('/auth/refresh/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) return null;
  const data = (await parseBody(res)) as { access?: string } | null;
  if (!data?.access) return null;
  await setTokens(data.access);
  return data.access;
}

type FetchInit = RequestInit & { auth?: boolean };

export async function apiFetch<T>(path: string, init: FetchInit = {}): Promise<T> {
  const { auth = true, headers: hdrIn, body, ...rest } = init;
  const headers: Record<string, string> = {};
  if (hdrIn) {
    if (hdrIn instanceof Headers) {
      hdrIn.forEach((v, k) => {
        headers[k] = v;
      });
    } else if (Array.isArray(hdrIn)) {
      for (const [k, v] of hdrIn) headers[k] = v;
    } else {
      Object.assign(headers, hdrIn as Record<string, string>);
    }
  }
  if (body !== undefined && body !== null && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (auth) {
    const access = await getAccess();
    if (access) headers['Authorization'] = `Bearer ${access}`;
  }

  const url = joinUrl(path);
  let res = await fetch(url, { ...rest, headers, body });

  if (res.status === 401 && auth) {
    const newAccess = await refreshAccess();
    if (!newAccess) {
      await clearTokens();
      throw new AuthError();
    }
    headers['Authorization'] = `Bearer ${newAccess}`;
    res = await fetch(url, { ...rest, headers, body });
    if (res.status === 401) {
      await clearTokens();
      throw new AuthError();
    }
  }

  const payload = await parseBody(res);
  if (!res.ok) {
    throw new Error(firstErrorMessage(payload, `Request failed: ${res.status}`));
  }
  return payload as T;
}

type AuthLoginResponse = { access: string; refresh: string };
type AuthSignupResponse = { user: User; access: string; refresh: string };

export async function signup(
  email: string,
  name: string,
  password: string,
): Promise<AuthSignupResponse> {
  const data = await apiFetch<AuthSignupResponse>('/auth/signup/', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, name, password }),
  });
  await setTokens(data.access, data.refresh);
  return data;
}

export async function login(email: string, password: string): Promise<AuthLoginResponse> {
  const data = await apiFetch<AuthLoginResponse>('/auth/login/', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password }),
  });
  await setTokens(data.access, data.refresh);
  return data;
}

export async function me(): Promise<User> {
  return await apiFetch<User>('/auth/me/');
}

export async function getCategories(): Promise<Category[]> {
  return await apiFetch<Category[]>('/categories/');
}

export async function createCategory(payload: { name: string; emoji?: string }): Promise<Category> {
  return await apiFetch<Category>('/categories/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(id: number): Promise<void> {
  await apiFetch<null>(`/categories/${id}/`, { method: 'DELETE' });
}

export async function updateCategory(
  id: number,
  partial: Partial<Pick<Category, 'name' | 'emoji'>>,
): Promise<Category> {
  return await apiFetch<Category>(`/categories/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(partial),
  });
}

export async function getMemos(): Promise<Memo[]> {
  return await apiFetch<Memo[]>('/memos/');
}

export type CreateMemoPayload = {
  category_name: string;
  memo: string;
  alarm_date?: string | null;
  tag?: string[];
};

export async function createMemo(payload: CreateMemoPayload): Promise<Memo> {
  return await apiFetch<Memo>('/memos/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateMemo(id: number, partial: Partial<CreateMemoPayload>): Promise<Memo> {
  return await apiFetch<Memo>(`/memos/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(partial),
  });
}

export async function deleteMemo(id: number): Promise<void> {
  await apiFetch<null>(`/memos/${id}/`, { method: 'DELETE' });
}

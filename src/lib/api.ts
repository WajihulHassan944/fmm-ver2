const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export function getToken() {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem("fmm_token") || undefined;
}

export function setToken(token: string) {
  if (typeof window !== "undefined") window.localStorage.setItem("fmm_token", token);
}

export function clearToken() {
  if (typeof window !== "undefined") window.localStorage.removeItem("fmm_token");
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function apiGetWithFallback<T>(path: string, fallback: T): Promise<T> {
  try {
    return await apiFetch<T>(path);
  } catch {
    return fallback;
  }
}

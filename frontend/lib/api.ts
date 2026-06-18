// Resolve the API base at runtime. In the browser we follow whatever host the
// app was loaded from (so a DHCP IP change never needs a rebuild) and keep only
// the port from the build-time NEXT_PUBLIC_API_BASE. Server-side / build-time
// falls back to the baked value.
export function apiBase(): string {
  const baked = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";
  if (typeof window !== "undefined") {
    try {
      const port = new URL(baked).port;
      return `${window.location.protocol}//${window.location.hostname}${port ? `:${port}` : ""}`;
    } catch {
      /* fall through to baked */
    }
  }
  return baked;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("grimoire_token");
}

async function request<T = any>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${apiBase()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const err = await res.json();
      msg = err.detail || err.error || msg;
    } catch {}
    throw new Error(msg);
  }

  // Some endpoints return empty body (204)
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  get: <T = any>(path: string) => request<T>("GET", path),
  post: <T = any>(path: string, body?: unknown) =>
    request<T>("POST", path, body),
  patch: <T = any>(path: string, body?: unknown) =>
    request<T>("PATCH", path, body),
};

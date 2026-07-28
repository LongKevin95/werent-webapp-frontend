const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:8080";

async function request(path, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message || `Request failed with status ${response.status}`,
    );
  }

  return payload;
}

export function login(payload) {
  return request("/api/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function register(payload) {
  return request("/api/auth/register", {
    method: "POST",
    body: payload,
  });
}

export function getCurrentUser(token) {
  return request("/api/auth/me", {
    method: "GET",
    token,
  });
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

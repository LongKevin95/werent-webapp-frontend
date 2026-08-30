const configuredApiBaseUrl =
  import.meta.env.VITE_API_URL?.trim() ||
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "";

const API_BASE_URL = (import.meta.env.DEV ? "" : configuredApiBaseUrl).replace(
  /\/+$/,
  "",
);

export class ApiRequestError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options.status;
    this.errors = options.errors;
    this.retryAfter = options.retryAfter;
  }
}

async function request(path, options = {}) {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    ...(options.body && !isFormData
      ? { "Content-Type": "application/json" }
      : {}),
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body
      ? isFormData
        ? options.body
        : JSON.stringify(options.body)
      : undefined,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const retryAfter = response.headers.get("retry-after");
    const fallbackMessage =
      response.status === 429
        ? "Bạn thao tác quá nhiều lần. Vui lòng đợi một lúc rồi thử lại."
        : `Yêu cầu thất bại với mã ${response.status}.`;

    throw new ApiRequestError(payload?.message || fallbackMessage, {
      status: response.status,
      errors: payload?.errors,
      retryAfter,
    });
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

export function loginWithGoogle(payload) {
  return request("/api/auth/google", {
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

export function getProfile(token) {
  return request("/api/users/me", {
    method: "GET",
    token,
  });
}

export function updateProfile(token, payload) {
  return request("/api/users/me", {
    method: "PATCH",
    token,
    body: payload,
  });
}

export function uploadAvatar(token, file) {
  const body = new FormData();
  body.append("avatar", file);

  return request("/api/users/me/avatar", {
    method: "PATCH",
    token,
    body,
  });
}

export function changePassword(token, payload) {
  return request("/api/users/me/change-password", {
    method: "PATCH",
    token,
    body: payload,
  });
}

export function submitAccountKyc(token, values, files) {
  const body = new FormData();
  Object.entries(values).forEach(([key, value]) => body.append(key, value));
  body.append("identityFront", files.identityFront);
  body.append("identityBack", files.identityBack);
  body.append("selfie", files.selfie);
  return request("/api/kyc/account", { method: "POST", token, body });
}

export function getAccountKyc(token) {
  return request("/api/kyc/account", { token });
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

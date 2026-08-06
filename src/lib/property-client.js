import { ApiRequestError, getApiBaseUrl } from "./auth-client";

const API_BASE_URL = getApiBaseUrl();

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

function createQueryString(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.size ? `?${searchParams.toString()}` : "";
}

export function listProperties(params = {}) {
  const suffix = createQueryString(params);
  return request(`/api/properties${suffix}`);
}

export function listMyProperties(token, params = {}) {
  const suffix = createQueryString(params);
  return request(`/api/properties/my-listings${suffix}`, { token });
}

export function createPropertyListing(token, body) {
  return request("/api/properties", {
    method: "POST",
    token,
    body,
  });
}

export function deletePropertyListing(token, propertyId) {
  return request(`/api/properties/${propertyId}`, {
    method: "DELETE",
    token,
  });
}

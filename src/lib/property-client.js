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
    signal: options.signal,
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

export function listAdministrativeDivisions() {
  return request("/api/administrative-divisions");
}

export function listSearchSuggestions(params = {}, options = {}) {
  const suffix = createQueryString(params);
  return request(`/api/search/suggestions${suffix}`, {
    signal: options.signal,
  });
}

export function createPropertyListing(token, body) {
  return request("/api/properties", {
    method: "POST",
    token,
    body,
  });
}

export function updatePropertyListing(token, propertyId, body) {
  return request(`/api/properties/${propertyId}`, {
    method: "PATCH",
    token,
    body,
  });
}

export function updatePropertyListingStatus(token, propertyId, status) {
  return updatePropertyListing(token, propertyId, { status });
}

export function deletePropertyListing(token, propertyId) {
  return request(`/api/properties/${propertyId}`, {
    method: "DELETE",
    token,
  });
}

export function getListingVerification(token, propertyId) {
  return request(`/api/kyc/listings/${propertyId}`, { token });
}

export function submitListingVerification(token, propertyId, documentType, files, note = "") {
  const body = new FormData();
  body.append("documentType", documentType);
  if (note) body.append("note", note);
  Array.from(files ?? []).forEach((file) => body.append("documents", file));
  return request(`/api/kyc/listings/${propertyId}`, { method: "POST", token, body });
}

import { ApiRequestError, getApiBaseUrl } from "./auth-client";

const API_BASE_URL = getApiBaseUrl();

async function request(path, token, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: { Authorization: `Bearer ${token}`, ...(options.body ? { "Content-Type": "application/json" } : {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new ApiRequestError(payload?.message || "Không thể cập nhật tin yêu thích.", { status: response.status, errors: payload?.errors });
  return payload;
}

export const listFavorites = (token) => request("/api/favorites", token);
export const addFavorite = (token, propertyId) => request("/api/favorites", token, { method: "POST", body: { propertyId } });
export const removeFavorite = (token, propertyId) => request(`/api/favorites/${propertyId}`, token, { method: "DELETE" });

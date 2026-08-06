import { ApiRequestError, getApiBaseUrl } from "./auth-client";

async function adminRequest(path, token, options = {}) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiRequestError(
      payload?.message || `Yêu cầu thất bại với mã ${response.status}.`,
      { status: response.status, errors: payload?.errors },
    );
  }

  return payload;
}

export function getAdminDashboard(token, options = {}) {
  return adminRequest("/api/admin/dashboard", token, options);
}

export function getAdminUsers(token, query = {}, options = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const suffix = searchParams.size ? `?${searchParams.toString()}` : "";
  return adminRequest(`/api/admin/users${suffix}`, token, options).then(
    (response) => {
      const items = (response.data?.items ?? []).map((user) => ({
        ...user,
        id: user.id ?? user._id,
      }));

      return {
        ...response,
        data: {
          ...response.data,
          items,
          pagination: response.data?.pagination ?? {
            page: 1,
            limit: items.length,
            total: items.length,
            totalPages: 1,
          },
        },
      };
    },
  );
}

export function createAdminUser(token, payload) {
  return adminRequest("/api/admin/users", token, {
    method: "POST",
    body: payload,
  });
}

export function updateAdminUser(token, userId, payload) {
  return adminRequest(`/api/admin/users/${userId}`, token, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteAdminUser(token, userId) {
  return adminRequest(`/api/admin/users/${userId}`, token, {
    method: "DELETE",
  });
}

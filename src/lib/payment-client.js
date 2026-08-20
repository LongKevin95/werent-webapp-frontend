import { ApiRequestError, getApiBaseUrl } from "./auth-client";

const API_BASE_URL = getApiBaseUrl();

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

export function createTopUpCheckout(token, body) {
  return request("/api/payments/top-up/checkout", {
    method: "POST",
    token,
    body,
  });
}

export function getTopUpPromotions(token) {
  return request("/api/payments/top-up/promotions", {
    method: "GET",
    token,
  });
}

export function getWalletOverview(token) {
  return request("/api/payments/wallet", {
    method: "GET",
    token,
  });
}

export function getPaymentHistory(token) {
  return request("/api/payments/history", {
    method: "GET",
    token,
  });
}

export function reconcileTopUpOrder(token, orderCode) {
  return request("/api/payments/top-up/reconcile", {
    method: "POST",
    token,
    body: { orderCode },
  });
}

import { ApiRequestError, getApiBaseUrl } from "./auth-client";

const API_BASE_URL = getApiBaseUrl();

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    method: options.method ?? "GET",
    signal: options.signal,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const retryAfter = response.headers.get("retry-after");
    const fallbackMessage =
      response.status === 429
        ? "Bạn gửi quá nhiều tin nhắn. Vui lòng đợi một lúc rồi thử lại."
        : `Yêu cầu thất bại với mã ${response.status}.`;

    throw new ApiRequestError(payload?.message || fallbackMessage, {
      errors: payload?.errors,
      retryAfter,
      status: response.status,
    });
  }

  return payload;
}

export function sendAiChatMessage(body, options = {}) {
  return request("/api/ai/chat", {
    body,
    method: "POST",
    signal: options.signal,
  });
}

export function searchListingsWithAi(body, options = {}) {
  return request("/api/ai/search", {
    body,
    method: "POST",
    signal: options.signal,
  });
}

export function generateListingContentWithAi(body, options = {}) {
  return request("/api/ai/listing-content", {
    body,
    method: "POST",
    signal: options.signal,
  });
}

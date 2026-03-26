import { env } from "./env";
import { clearSession, getAccessToken, refreshAccessSession } from "./auth";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  accessToken?: string;
  body?: Record<string, unknown>;
};

export async function apiRequest(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.accessToken
        ? {
            Authorization: `Bearer ${options.accessToken}`,
          }
        : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
}

type AuthedRequestOptions = Omit<RequestOptions, "accessToken">;

export async function apiAuthedRequest(path: string, options: AuthedRequestOptions = {}) {
  let token = getAccessToken();

  if (!token) {
    const refreshed = await refreshAccessSession();
    if (!refreshed.ok || !refreshed.accessToken) {
      return {
        ok: false,
        status: 401,
        payload: {
          ok: false,
          error: {
            code: "UNAUTHENTICATED",
            message: "Session expired. Please log in again.",
          },
        },
      };
    }
    token = refreshed.accessToken;
  }

  let result = await apiRequest(path, {
    ...options,
    accessToken: token,
  });

  if (result.status === 401) {
    const refreshed = await refreshAccessSession();
    if (!refreshed.ok || !refreshed.accessToken) {
      clearSession();
      return {
        ok: false,
        status: 401,
        payload: {
          ok: false,
          error: {
            code: "UNAUTHENTICATED",
            message: "Session expired. Please log in again.",
          },
        },
      };
    }

    result = await apiRequest(path, {
      ...options,
      accessToken: refreshed.accessToken,
    });
  }

  if (result.status === 401) {
    clearSession();
  }

  return result;
}

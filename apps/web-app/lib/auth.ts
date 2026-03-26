"use client";

import { env } from "./env";

export type BrowserRole = "user" | "admin";

export type BrowserSession = {
  accessToken: string;
  refreshToken: string;
  role: BrowserRole;
};

const ACCESS_KEY = "webapp.access_token";
const REFRESH_KEY = "webapp.refresh_token";
const ROLE_KEY = "webapp.role";

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function getAccessToken(): string {
  if (!canUseStorage()) {
    return "";
  }
  return window.localStorage.getItem(ACCESS_KEY) ?? "";
}

export function getRefreshToken(): string {
  if (!canUseStorage()) {
    return "";
  }
  return window.localStorage.getItem(REFRESH_KEY) ?? "";
}

export function getRole(): BrowserRole {
  if (!canUseStorage()) {
    return "user";
  }
  const role = window.localStorage.getItem(ROLE_KEY);
  return role === "admin" ? "admin" : "user";
}

export function setSession(session: BrowserSession): void {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(ACCESS_KEY, session.accessToken);
  window.localStorage.setItem(REFRESH_KEY, session.refreshToken);
  window.localStorage.setItem(ROLE_KEY, session.role);
}

export function setRole(role: BrowserRole): void {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(ROLE_KEY, role);
}

export function clearSession(): void {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem(ROLE_KEY);
}

function parseApiErrorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }
  return fallback;
}

function resolveRoleFromProfile(profile: { roles?: string[] } | undefined): BrowserRole {
  if (profile?.roles?.includes("admin")) {
    return "admin";
  }
  return "user";
}

function extractTokens(payload: Record<string, unknown>): { accessToken?: string; refreshToken?: string } {
  const tokens = (payload as { data?: { tokens?: { access_token?: unknown; refresh_token?: unknown } } })?.data?.tokens;
  return {
    accessToken: typeof tokens?.access_token === "string" ? tokens.access_token : undefined,
    refreshToken: typeof tokens?.refresh_token === "string" ? tokens.refresh_token : undefined,
  };
}

type RequestJsonResult = {
  ok: boolean;
  status: number;
  payload: Record<string, unknown>;
  networkError?: string;
};

async function requestJson(url: string, init: RequestInit): Promise<RequestJsonResult> {
  try {
    const response = await fetch(url, init);
    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    return {
      ok: response.ok,
      status: response.status,
      payload,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      payload: {},
      networkError: "Unable to reach API. Confirm backend is running and API URL is correct.",
    };
  }
}

export async function hydrateRoleFromProfile(accessToken: string): Promise<BrowserRole> {
  const result = await requestJson(`${env.apiBaseUrl}/api/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!result.ok) {
    throw new Error(`ROLE_LOOKUP_FAILED_${result.status || "NETWORK"}`);
  }

  const role = resolveRoleFromProfile((result.payload as { data?: { profile?: { roles?: string[] } } })?.data?.profile);
  setRole(role);
  return role;
}

export async function loginWithPassword(credentials: { email: string; password: string }): Promise<{
  ok: boolean;
  role?: BrowserRole;
  error?: string;
}> {
  const result = await requestJson(`${env.apiBaseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
    cache: "no-store",
  });

  if (!result.ok) {
    return {
      ok: false,
      error: result.networkError ?? parseApiErrorMessage(result.payload, "Login failed."),
    };
  }

  const payload = result.payload;
  const { accessToken, refreshToken } = extractTokens(payload);

  if (typeof accessToken !== "string" || typeof refreshToken !== "string") {
    clearSession();
    return {
      ok: false,
      error: "Login response did not include valid tokens.",
    };
  }

  let role: BrowserRole = "user";
  try {
    role = await hydrateRoleFromProfile(accessToken);
  } catch {
    setRole(role);
  }
  setSession({ accessToken, refreshToken, role });
  return { ok: true, role };
}

export async function registerWithPassword(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<{ ok: boolean; role?: BrowserRole; error?: string }> {
  const result = await requestJson(`${env.apiBaseUrl}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      display_name: input.displayName,
    }),
    cache: "no-store",
  });

  if (!result.ok) {
    return {
      ok: false,
      error: result.networkError ?? parseApiErrorMessage(result.payload, "Registration failed."),
    };
  }

  const payload = result.payload;
  const { accessToken, refreshToken } = extractTokens(payload);

  if (typeof accessToken !== "string" || typeof refreshToken !== "string") {
    clearSession();
    return {
      ok: false,
      error: "Registration response did not include valid tokens.",
    };
  }

  let role: BrowserRole = "user";
  try {
    role = await hydrateRoleFromProfile(accessToken);
  } catch {
    setRole(role);
  }
  setSession({ accessToken, refreshToken, role });
  return { ok: true, role };
}

export async function requireSession(requiredRole: BrowserRole = "user"): Promise<{
  ok: boolean;
  role?: BrowserRole;
  accessToken?: string;
  forbidden?: boolean;
  error?: string;
}> {
  let accessToken = getAccessToken();
  let role: BrowserRole = getRole();

  if (!accessToken) {
    const refreshed = await refreshAccessSession();
    if (!refreshed.ok || !refreshed.accessToken) {
      return { ok: false, error: "Session expired. Please log in again." };
    }
    accessToken = refreshed.accessToken;
    role = refreshed.role ?? getRole();
  }

  try {
    role = await hydrateRoleFromProfile(accessToken);
  } catch {
    const refreshed = await refreshAccessSession();
    if (!refreshed.ok || !refreshed.accessToken) {
      return { ok: false, error: "Session expired. Please log in again." };
    }
    accessToken = refreshed.accessToken;
    role = refreshed.role ?? getRole();
  }

  if (requiredRole === "admin" && role !== "admin") {
    return {
      ok: false,
      forbidden: true,
      role,
      accessToken,
      error: "Forbidden: admin access is required.",
    };
  }

  return { ok: true, role, accessToken };
}

export async function refreshAccessSession(): Promise<{ ok: boolean; accessToken?: string; role?: BrowserRole }> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return { ok: false };
  }

  const result = await requestJson(`${env.apiBaseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  });

  if (!result.ok) {
    clearSession();
    return { ok: false };
  }

  const payload = result.payload;
  const { accessToken: newAccess, refreshToken: newRefresh } = extractTokens(payload);
  if (typeof newAccess !== "string" || typeof newRefresh !== "string") {
    clearSession();
    return { ok: false };
  }

  let role: BrowserRole = "user";
  try {
    role = await hydrateRoleFromProfile(newAccess);
  } catch {
    setRole(role);
  }
  setSession({ accessToken: newAccess, refreshToken: newRefresh, role });
  return { ok: true, accessToken: newAccess, role };
}

export async function logoutSession(options: { all?: boolean } = {}): Promise<void> {
  const refreshToken = getRefreshToken();
  const endpoint = options.all ? "/api/auth/logout-all" : "/api/auth/logout";

  if (refreshToken) {
    await fetch(`${env.apiBaseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    }).catch(() => undefined);
  }

  clearSession();
}

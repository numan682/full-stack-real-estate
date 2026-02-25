import "server-only";

import { getBackendBaseUrl } from "@/lib/api-base";
import { getPortalTokenFromCookie } from "@/lib/portal/session";
import type { PortalUser } from "@/lib/portal/types";
import type { AdminInquiry, AdminProperty } from "@/lib/admin/types";

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  authenticated?: boolean;
  unwrapData?: boolean;
};

type ApiResult<T> = {
  ok: boolean;
  status: number;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
};

async function parseJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function portalApiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<ApiResult<T>> {
  const method = options.method ?? "GET";
  const authenticated = options.authenticated ?? true;
  const unwrapData = options.unwrapData ?? true;
  const token = options.token ?? (authenticated ? await getPortalTokenFromCookie() : null);
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (authenticated && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${getBackendBaseUrl()}/api/v1${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: typeof payload.message === "string" ? payload.message : "Request failed.",
      errors: typeof payload.errors === "object" && payload.errors !== null
        ? payload.errors as Record<string, string[]>
        : undefined,
    };
  }

  return {
    ok: true,
    status: response.status,
    message: typeof payload.message === "string" ? payload.message : undefined,
    data: (unwrapData ? payload.data : payload) as T,
  };
}

export async function loginPortal(email: string, password: string, remember: boolean) {
  return portalApiFetch<{
    token: string;
    expires_at?: string | null;
    redirect_path: string;
    user: PortalUser;
  }>("/auth/login", {
    method: "POST",
    body: {
      email,
      password,
      remember,
    },
    authenticated: false,
  });
}

export async function fetchPortalMe(token?: string | null) {
  return portalApiFetch<{ user: PortalUser }>("/auth/me", {
    token,
  });
}

export async function logoutPortal(token?: string | null) {
  return portalApiFetch<void>("/auth/logout", {
    method: "POST",
    token,
  });
}

export async function fetchAgentProperties(query = "") {
  const normalizedQuery = query ? `?${query.replace(/^\?/, "")}` : "";

  return portalApiFetch<{
    data: AdminProperty[];
    meta?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }>(`/agent/properties${normalizedQuery}`, {
    unwrapData: false,
  });
}

export async function fetchAgentProperty(propertyId: number) {
  return portalApiFetch<AdminProperty>(`/agent/properties/${propertyId}`);
}

export async function createAgentProperty(payload: Record<string, unknown>) {
  return portalApiFetch<AdminProperty>("/agent/properties", {
    method: "POST",
    body: payload,
  });
}

export async function updateAgentProperty(propertyId: number, payload: Record<string, unknown>) {
  return portalApiFetch<AdminProperty>(`/agent/properties/${propertyId}`, {
    method: "PUT",
    body: payload,
  });
}

export async function fetchAgentInquiries(query = "") {
  const normalizedQuery = query ? `?${query.replace(/^\?/, "")}` : "";

  return portalApiFetch<{
    data: AdminInquiry[];
    meta?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }>(`/agent/inquiries${normalizedQuery}`, {
    unwrapData: false,
  });
}

export async function updateAgentInquiryStatus(inquiryId: number, status: AdminInquiry["status"]) {
  return portalApiFetch<AdminInquiry>(`/agent/inquiries/${inquiryId}/status`, {
    method: "PATCH",
    body: {
      status,
    },
  });
}

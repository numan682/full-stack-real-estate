import "server-only";

import { getBackendBaseUrl } from "@/lib/api-base";
import { getAdminTokenFromCookie } from "@/lib/admin/session";
import type {
  AdminBlogPost,
  AdminCmsData,
  AdminDashboardData,
  AdminInquiry,
  AdminProperty,
  AdminUser,
} from "@/lib/admin/types";

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

async function adminApiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<ApiResult<T>> {
  const method = options.method ?? "GET";
  const authenticated = options.authenticated ?? true;
  const unwrapData = options.unwrapData ?? true;
  const token = options.token ?? (authenticated ? await getAdminTokenFromCookie() : null);
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (authenticated && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${getBackendBaseUrl()}/api/v1/admin${path}`, {
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

export async function loginAdmin(email: string, password: string, remember: boolean) {
  return adminApiFetch<{
    token: string;
    expires_at?: string | null;
    user: AdminUser;
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

export async function fetchAdminMe() {
  return adminApiFetch<{ user: AdminUser }>("/auth/me");
}

export async function logoutAdmin(token?: string | null) {
  return adminApiFetch<void>("/auth/logout", {
    method: "POST",
    token,
  });
}

export async function fetchAdminDashboard() {
  return adminApiFetch<AdminDashboardData>("/dashboard");
}

export async function fetchAdminCms() {
  return adminApiFetch<AdminCmsData>("/cms");
}

export async function updateAdminHomeTemplate(homeTemplate: string) {
  return adminApiFetch<{ active_home_template: string }>("/cms/home-template", {
    method: "PUT",
    body: {
      home_template: homeTemplate,
    },
  });
}

export async function updateAdminHomeSections(sections: Array<{
  section_key: string;
  name?: string;
  sort_order: number;
  is_enabled: boolean;
  payload: Record<string, unknown>;
}>) {
  return adminApiFetch<{ home_sections: AdminCmsData["home_sections"] }>("/cms/home-sections", {
    method: "PUT",
    body: {
      sections,
    },
  });
}

export async function updateAdminPageSections(pages: Array<{
  page_key: string;
  sections: Array<{
    section_key: string;
    name?: string;
    sort_order: number;
    is_enabled: boolean;
    payload: Record<string, unknown>;
  }>;
}>) {
  return adminApiFetch<{ page_sections: AdminCmsData["page_sections"] }>("/cms/page-sections", {
    method: "PUT",
    body: {
      pages,
    },
  });
}

export async function updateAdminGlobalSettings(settings: AdminCmsData["global_settings"]) {
  return adminApiFetch<{ global_settings: AdminCmsData["global_settings"] }>("/cms/global-settings", {
    method: "PUT",
    body: settings,
  });
}

export async function updateAdminCmsPages(pages: Array<{
  page_key: string;
  template_key: string;
  slug?: string;
  title?: string;
  nav_label?: string;
  nav_group?: string;
  nav_order: number;
  show_in_nav: boolean;
  is_active: boolean;
  seo: Record<string, unknown>;
  content: Record<string, unknown>;
}>) {
  return adminApiFetch<{ cms_pages: AdminCmsData["cms_pages"] }>("/cms/pages", {
    method: "PUT",
    body: {
      pages,
    },
  });
}

export async function fetchAdminProperties(query = "") {
  const normalizedQuery = query ? `?${query.replace(/^\?/, "")}` : "";

  return adminApiFetch<{
    data: AdminProperty[];
    meta?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }>(`/properties${normalizedQuery}`, {
    unwrapData: false,
  });
}

export async function fetchAdminProperty(propertyId: number) {
  return adminApiFetch<AdminProperty>(`/properties/${propertyId}`);
}

export async function createAdminProperty(payload: Record<string, unknown>) {
  return adminApiFetch<AdminProperty>("/properties", {
    method: "POST",
    body: payload,
  });
}

export async function updateAdminProperty(propertyId: number, payload: Record<string, unknown>) {
  return adminApiFetch<AdminProperty>(`/properties/${propertyId}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deleteAdminProperty(propertyId: number) {
  return adminApiFetch<void>(`/properties/${propertyId}`, {
    method: "DELETE",
  });
}

export async function fetchAdminBlogs(query = "") {
  const normalizedQuery = query ? `?${query.replace(/^\?/, "")}` : "";

  return adminApiFetch<{
    data: AdminBlogPost[];
    meta?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }>(`/blogs${normalizedQuery}`, {
    unwrapData: false,
  });
}

export async function fetchAdminBlog(blogId: number) {
  return adminApiFetch<AdminBlogPost>(`/blogs/${blogId}`);
}

export async function createAdminBlog(payload: Record<string, unknown>) {
  return adminApiFetch<AdminBlogPost>("/blogs", {
    method: "POST",
    body: payload,
  });
}

export async function updateAdminBlog(blogId: number, payload: Record<string, unknown>) {
  return adminApiFetch<AdminBlogPost>(`/blogs/${blogId}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deleteAdminBlog(blogId: number) {
  return adminApiFetch<void>(`/blogs/${blogId}`, {
    method: "DELETE",
  });
}

export async function fetchAdminInquiries(query = "") {
  const normalizedQuery = query ? `?${query.replace(/^\?/, "")}` : "";

  return adminApiFetch<{
    data: AdminInquiry[];
    meta?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }>(`/inquiries${normalizedQuery}`, {
    unwrapData: false,
  });
}

export async function updateAdminInquiryStatus(inquiryId: number, status: AdminInquiry["status"]) {
  return adminApiFetch<AdminInquiry>(`/inquiries/${inquiryId}/status`, {
    method: "PATCH",
    body: {
      status,
    },
  });
}

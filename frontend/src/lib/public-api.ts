import "server-only";

import { getBackendBaseUrl } from "@/lib/api-base";

export type ApiPaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type PublicProperty = {
  id: number;
  uuid: string;
  title: string;
  slug: string;
  description?: string | null;
  property_type: string;
  listing_type: "sale" | "rent";
  status: "draft" | "published" | "archived";
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_sqft?: number | null;
  price: string | number;
  address_line: string;
  city: string;
  state?: string | null;
  postal_code?: string | null;
  country: string;
  latitude?: string | null;
  longitude?: string | null;
  features?: unknown[];
  is_featured: boolean;
  published_at?: string | null;
  primary_image?: {
    path?: string | null;
    alt_text?: string | null;
  } | null;
  images?: Array<{
    id: number;
    path: string;
    alt_text?: string | null;
    sort_order: number;
    is_primary: boolean;
  }>;
  agency?: {
    id?: number | null;
    name?: string | null;
    slug?: string | null;
  };
  agent?: {
    id?: number | null;
    first_name?: string | null;
    last_name?: string | null;
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
    avatar_path?: string | null;
    position?: string | null;
    is_active?: boolean;
  };
};

export type PublicBlogPost = {
  id: number;
  uuid: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  featured_image_path?: string | null;
  featured_image_alt?: string | null;
  author_name?: string | null;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  seo_payload?: Record<string, unknown>;
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type PublicAgentProperty = {
  id: number;
  title: string;
  slug: string;
  listing_type: "sale" | "rent";
  price: string | number;
  address_line: string;
  city: string;
  state?: string | null;
  country: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_sqft?: number | null;
  is_featured: boolean;
  primary_image?: {
    path?: string | null;
    alt_text?: string | null;
  } | null;
};

export type PublicAgent = {
  id: number;
  slug: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string | null;
  avatar_path?: string | null;
  position?: string | null;
  bio?: string | null;
  is_active: boolean;
  published_properties_count?: number | null;
  agency?: {
    id?: number | null;
    name?: string | null;
    slug?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
  } | null;
  properties?: PublicAgentProperty[];
};

type ApiResult<T> = {
  ok: boolean;
  status: number;
  data?: T;
  meta?: ApiPaginationMeta;
  message?: string;
};

type QueryValue = string | number | boolean | null | undefined;

type CollectionPayload<T> = {
  data?: T[];
  meta?: ApiPaginationMeta;
  message?: string;
};

type ItemPayload<T> = {
  data?: T;
  message?: string;
};

function toQueryString(query: Record<string, QueryValue>) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      return;
    }

    params.set(key, String(value));
  });

  const queryString = params.toString();

  return queryString === "" ? "" : `?${queryString}`;
}

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return await response.json() as T;
  } catch {
    return null;
  }
}

async function fetchCollection<T>(
  path: string,
  query: Record<string, QueryValue> = {},
): Promise<ApiResult<T[]>> {
  const endpoint = `${getBackendBaseUrl()}${path}${toQueryString(query)}`;

  try {
    const response = await fetch(endpoint, {
      next: {
        revalidate: 30,
      },
    });
    const payload = await parseJson<CollectionPayload<T>>(response);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: payload?.message ?? "Request failed.",
        data: [],
      };
    }

    return {
      ok: true,
      status: response.status,
      data: payload?.data ?? [],
      meta: payload?.meta,
      message: payload?.message,
    };
  } catch {
    return {
      ok: false,
      status: 500,
      data: [],
      message: "Network error.",
    };
  }
}

async function fetchItem<T>(path: string): Promise<ApiResult<T>> {
  const endpoint = `${getBackendBaseUrl()}${path}`;

  try {
    const response = await fetch(endpoint, {
      next: {
        revalidate: 30,
      },
    });
    const payload = await parseJson<ItemPayload<T>>(response);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: payload?.message ?? "Request failed.",
      };
    }

    return {
      ok: true,
      status: response.status,
      data: payload?.data,
      message: payload?.message,
    };
  } catch {
    return {
      ok: false,
      status: 500,
      message: "Network error.",
    };
  }
}

export async function fetchPublicProperties(query: Record<string, QueryValue> = {}) {
  return fetchCollection<PublicProperty>("/api/v1/properties", query);
}

export async function fetchPublicProperty(slug: string) {
  return fetchItem<PublicProperty>(`/api/v1/properties/${encodeURIComponent(slug)}`);
}

export async function fetchPublicBlogs(query: Record<string, QueryValue> = {}) {
  return fetchCollection<PublicBlogPost>("/api/v1/blogs", query);
}

export async function fetchPublicBlog(slug: string) {
  return fetchItem<PublicBlogPost>(`/api/v1/blogs/${encodeURIComponent(slug)}`);
}

export async function fetchPublicAgents(query: Record<string, QueryValue> = {}) {
  return fetchCollection<PublicAgent>("/api/v1/agents", query);
}

export async function fetchPublicAgent(agent: string) {
  return fetchItem<PublicAgent>(`/api/v1/agents/${encodeURIComponent(agent)}`);
}

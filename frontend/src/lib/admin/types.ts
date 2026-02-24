export type AdminUser = {
  id: number;
  name: string;
  email: string;
};

export type AdminDashboardData = {
  stats: {
    properties: number;
    blogs: number;
    agencies: number;
    agents: number;
    inquiries: number;
  };
  recent_inquiries: Array<{
    id: number;
    property_id: number | null;
    full_name: string;
    email: string;
    source: string;
    status: "new" | "contacted" | "resolved" | "spam";
    created_at: string;
    property?: {
      id: number;
      title: string;
      slug: string;
    } | null;
  }>;
  active_home_template: string;
};

export type AdminCmsData = {
  home_templates: Record<string, { label?: string; description?: string }>;
  template_options: Record<string, { label?: string; description?: string }>;
  section_templates: Record<string, {
    label?: string;
    description?: string;
    payload?: Record<string, unknown>;
  }>;
  active_home_template: string;
  home_sections: Array<{
    id?: number;
    page_key: string;
    section_key: string;
    name?: string | null;
    sort_order: number;
    is_enabled: boolean;
    payload?: Record<string, unknown>;
  }>;
  page_sections: Record<string, Array<{
    sectionKey: string;
    name?: string | null;
    sortOrder: number;
    isEnabled: boolean;
    payload?: Record<string, unknown>;
  }>>;
  cms_pages: Array<{
    id?: number;
    page_key: string;
    template_key: string;
    slug?: string | null;
    title?: string | null;
    nav_label?: string | null;
    nav_group?: string | null;
    nav_order: number;
    show_in_nav: boolean;
    is_active: boolean;
    seo?: Record<string, unknown>;
    content?: Record<string, unknown>;
  }>;
  global_settings: {
    branding?: {
      site_name?: string;
      logo_path?: string;
      logo_alt?: string;
    };
    header?: {
      announcement_text?: string;
      announcement_link?: string;
      home_nav_label?: string;
      login_label?: string;
      add_listing_label?: string;
      add_listing_link?: string;
    };
    footer?: {
      address?: string;
      email?: string;
      copyright_text?: string;
    };
  };
};

export type AdminProperty = {
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
  price: string;
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
  created_at?: string;
  updated_at?: string;
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
};

export type AdminBlogPost = {
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
  created_at?: string;
  updated_at?: string;
};

export type AdminInquiry = {
  id: number;
  property_id: number | null;
  full_name: string;
  email: string;
  phone?: string | null;
  message: string;
  source: string;
  status: "new" | "contacted" | "resolved" | "spam";
  ip_address?: string | null;
  created_at: string;
  property?: {
    id: number;
    title: string;
    slug: string;
  } | null;
};

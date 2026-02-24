import { getBackendBaseUrl } from "@/lib/api-base";

export type CmsSectionConfig = {
  sectionKey: string;
  name?: string | null;
  sortOrder: number;
  isEnabled: boolean;
  payload?: Record<string, unknown>;
};

export type CmsPageConfig = {
  pageKey: string;
  templateKey: string;
  slug: string;
  routePath: string;
  title?: string | null;
  navLabel?: string | null;
  navGroup?: string | null;
  navOrder: number;
  showInNav: boolean;
  isActive: boolean;
  seo?: Record<string, unknown>;
  content?: Record<string, unknown>;
};

export type CmsNavigationItem = {
  pageKey: string;
  label: string;
  path: string;
  group?: string | null;
  order: number;
};

export type CmsGlobalSettings = {
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

export type CmsConfigPayload = {
  homeTemplate: string;
  homeSections: CmsSectionConfig[];
  pageSections: Record<string, CmsSectionConfig[]>;
  pages: CmsPageConfig[];
  navigation: CmsNavigationItem[];
  globalSettings: CmsGlobalSettings;
};

const DEFAULT_CMS_CONFIG: CmsConfigPayload = {
  homeTemplate: "home_01",
  homeSections: [],
  pageSections: {},
  pages: [],
  navigation: [],
  globalSettings: {},
};

export async function fetchCmsConfig(): Promise<CmsConfigPayload> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return DEFAULT_CMS_CONFIG;
  }

  const endpoint = `${getBackendBaseUrl()}/api/v1/cms/config`;

  try {
    const response = await fetch(endpoint, {
      next: {
        revalidate: 30,
      },
    });

    if (!response.ok) {
      return DEFAULT_CMS_CONFIG;
    }

    const payload = await response.json() as { cms?: Partial<CmsConfigPayload> };
    if (!payload?.cms) {
      return DEFAULT_CMS_CONFIG;
    }

    return {
      ...DEFAULT_CMS_CONFIG,
      ...payload.cms,
      homeSections: payload.cms.homeSections ?? [],
      pageSections: payload.cms.pageSections ?? {},
      pages: payload.cms.pages ?? [],
      navigation: payload.cms.navigation ?? [],
      globalSettings: payload.cms.globalSettings ?? {},
    };
  } catch {
    return DEFAULT_CMS_CONFIG;
  }
}

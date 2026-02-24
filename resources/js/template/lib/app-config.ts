export type CmsSectionConfig = {
  sectionKey: string;
  name?: string | null;
  sortOrder: number;
  isEnabled: boolean;
  payload?: Record<string, unknown>;
};

export type GlobalSettings = {
  header?: {
    announcement_text?: string;
    announcement_link?: string;
    login_label?: string;
    add_listing_label?: string;
  };
  footer?: {
    address?: string;
    email?: string;
  };
};

export type TemplateRuntimeConfig = {
  cms?: {
    homeTemplate?: string;
    globalSettings?: GlobalSettings;
    homeSections?: CmsSectionConfig[];
  };
};

declare global {
  interface Window {
    __APP_CONFIG__?: TemplateRuntimeConfig;
  }
}

const EMPTY_CONFIG: TemplateRuntimeConfig = {};

export function getRuntimeConfig(): TemplateRuntimeConfig {
  return window.__APP_CONFIG__ ?? EMPTY_CONFIG;
}

export function getActiveHomeTemplateKey(): string {
  return getRuntimeConfig().cms?.homeTemplate ?? "home_01";
}

export function getGlobalSettings(): GlobalSettings {
  return getRuntimeConfig().cms?.globalSettings ?? {};
}

export function getHomeSections(): CmsSectionConfig[] {
  return getRuntimeConfig().cms?.homeSections ?? [];
}

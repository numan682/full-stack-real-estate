import type { ComponentType } from "react";
import type { SeoMetadata } from "@/lib/seo-metadata";

export type TemplatePageEntry = {
  moduleLoader: () => Promise<TemplatePageModule>;
  routePath: string;
  slug: string[];
};

type TemplatePageDefinition = {
  module: string;
  routePath: string;
  slug: string[];
};

export type TemplatePageModule = {
  default: ComponentType;
  metadata: SeoMetadata;
};

const templatePageModules = import.meta.glob<TemplatePageModule>("./template-pages/*.jsx");

const templatePages: Record<string, TemplatePageDefinition> = {
  "404": { module: "404", routePath: "/404", slug: ["404"] },
  "about_us_01": { module: "about_us_01", routePath: "/about_us_01", slug: ["about_us_01"] },
  "about_us_02": { module: "about_us_02", routePath: "/about_us_02", slug: ["about_us_02"] },
  "agency_details": { module: "agency_details", routePath: "/agency_details", slug: ["agency_details"] },
  "agency": { module: "agency", routePath: "/agency", slug: ["agency"] },
  "agent_details": { module: "agent_details", routePath: "/agent_details", slug: ["agent_details"] },
  "agent": { module: "agent", routePath: "/agent", slug: ["agent"] },
  "blog_01": { module: "blog_01", routePath: "/blog_01", slug: ["blog_01"] },
  "blog_02": { module: "blog_02", routePath: "/blog_02", slug: ["blog_02"] },
  "blog_03": { module: "blog_03", routePath: "/blog_03", slug: ["blog_03"] },
  "blog_details": { module: "blog_details", routePath: "/blog_details", slug: ["blog_details"] },
  "compare": { module: "compare", routePath: "/compare", slug: ["compare"] },
  "contact": { module: "contact", routePath: "/contact", slug: ["contact"] },
  "faq": { module: "faq", routePath: "/faq", slug: ["faq"] },
  "index-2": { module: "index_2", routePath: "/index-2", slug: ["index-2"] },
  "index-3": { module: "index_3", routePath: "/index-3", slug: ["index-3"] },
  "index-4": { module: "index_4", routePath: "/index-4", slug: ["index-4"] },
  "index-5": { module: "index_5", routePath: "/index-5", slug: ["index-5"] },
  "index-6": { module: "index_6", routePath: "/index-6", slug: ["index-6"] },
  "index-7": { module: "index_7", routePath: "/index-7", slug: ["index-7"] },
  "listing_01": { module: "listing_01", routePath: "/listing_01", slug: ["listing_01"] },
  "listing_02": { module: "listing_02", routePath: "/listing_02", slug: ["listing_02"] },
  "listing_03": { module: "listing_03", routePath: "/listing_03", slug: ["listing_03"] },
  "listing_04": { module: "listing_04", routePath: "/listing_04", slug: ["listing_04"] },
  "listing_05": { module: "listing_05", routePath: "/listing_05", slug: ["listing_05"] },
  "listing_06": { module: "listing_06", routePath: "/listing_06", slug: ["listing_06"] },
  "listing_07": { module: "listing_07", routePath: "/listing_07", slug: ["listing_07"] },
  "listing_08": { module: "listing_08", routePath: "/listing_08", slug: ["listing_08"] },
  "listing_09": { module: "listing_09", routePath: "/listing_09", slug: ["listing_09"] },
  "listing_10": { module: "listing_10", routePath: "/listing_10", slug: ["listing_10"] },
  "listing_11": { module: "listing_11", routePath: "/listing_11", slug: ["listing_11"] },
  "listing_12": { module: "listing_12", routePath: "/listing_12", slug: ["listing_12"] },
  "listing_13": { module: "listing_13", routePath: "/listing_13", slug: ["listing_13"] },
  "listing_14": { module: "listing_14", routePath: "/listing_14", slug: ["listing_14"] },
  "listing_15": { module: "listing_15", routePath: "/listing_15", slug: ["listing_15"] },
  "listing_16": { module: "listing_16", routePath: "/listing_16", slug: ["listing_16"] },
  "listing_17": { module: "listing_17", routePath: "/listing_17", slug: ["listing_17"] },
  "listing_details_01": { module: "listing_details_01", routePath: "/listing_details_01", slug: ["listing_details_01"] },
  "listing_details_02": { module: "listing_details_02", routePath: "/listing_details_02", slug: ["listing_details_02"] },
  "listing_details_03": { module: "listing_details_03", routePath: "/listing_details_03", slug: ["listing_details_03"] },
  "listing_details_04": { module: "listing_details_04", routePath: "/listing_details_04", slug: ["listing_details_04"] },
  "listing_details_05": { module: "listing_details_05", routePath: "/listing_details_05", slug: ["listing_details_05"] },
  "listing_details_06": { module: "listing_details_06", routePath: "/listing_details_06", slug: ["listing_details_06"] },
  "pricing_01": { module: "pricing_01", routePath: "/pricing_01", slug: ["pricing_01"] },
  "pricing_02": { module: "pricing_02", routePath: "/pricing_02", slug: ["pricing_02"] },
  "project_01": { module: "project_01", routePath: "/project_01", slug: ["project_01"] },
  "project_02": { module: "project_02", routePath: "/project_02", slug: ["project_02"] },
  "project_03": { module: "project_03", routePath: "/project_03", slug: ["project_03"] },
  "project_04": { module: "project_04", routePath: "/project_04", slug: ["project_04"] },
  "project_details_01": { module: "project_details_01", routePath: "/project_details_01", slug: ["project_details_01"] },
  "service_01": { module: "service_01", routePath: "/service_01", slug: ["service_01"] },
  "service_02": { module: "service_02", routePath: "/service_02", slug: ["service_02"] },
  "service_details": { module: "service_details", routePath: "/service_details", slug: ["service_details"] },
  "dashboard/account-settings": { module: "dashboard_account_settings", routePath: "/dashboard/account-settings", slug: ["dashboard","account-settings"] },
  "dashboard/account-settings(pass-change)": { module: "dashboard_account_settings_pass_change_", routePath: "/dashboard/account-settings(pass-change)", slug: ["dashboard","account-settings(pass-change)"] },
  "dashboard/add-property": { module: "dashboard_add_property", routePath: "/dashboard/add-property", slug: ["dashboard","add-property"] },
  "dashboard/dashboard-index": { module: "dashboard_dashboard_index", routePath: "/dashboard/dashboard-index", slug: ["dashboard","dashboard-index"] },
  "dashboard/favourites": { module: "dashboard_favourites", routePath: "/dashboard/favourites", slug: ["dashboard","favourites"] },
  "dashboard/membership": { module: "dashboard_membership", routePath: "/dashboard/membership", slug: ["dashboard","membership"] },
  "dashboard/message": { module: "dashboard_message", routePath: "/dashboard/message", slug: ["dashboard","message"] },
  "dashboard/profile": { module: "dashboard_profile", routePath: "/dashboard/profile", slug: ["dashboard","profile"] },
  "dashboard/properties-list": { module: "dashboard_properties_list", routePath: "/dashboard/properties-list", slug: ["dashboard","properties-list"] },
  "dashboard/review": { module: "dashboard_review", routePath: "/dashboard/review", slug: ["dashboard","review"] },
  "dashboard/saved-search": { module: "dashboard_saved_search", routePath: "/dashboard/saved-search", slug: ["dashboard","saved-search"] },
};

function getModulePath(moduleName: string): string {
  return `./template-pages/${moduleName}.jsx`;
}

function getTemplateModuleLoader(moduleName: string): (() => Promise<TemplatePageModule>) | null {
  const importer = templatePageModules[getModulePath(moduleName)];

  if (!importer) {
    return null;
  }

  return importer;
}

function mapDefinitionToEntry(definition: TemplatePageDefinition): TemplatePageEntry | null {
  const moduleLoader = getTemplateModuleLoader(definition.module);
  if (!moduleLoader) {
    return null;
  }

  return {
    moduleLoader,
    routePath: definition.routePath,
    slug: definition.slug,
  };
}

export function getTemplatePageBySlug(slug: string[] = []): TemplatePageEntry | null {
  const definition = templatePages[slug.join("/")];
  if (!definition) {
    return null;
  }

  return mapDefinitionToEntry(definition);
}

export function getTemplateStaticParams(): Array<{ slug: string[] }> {
  return Object.values(templatePages)
    .filter((page) => page.slug.length > 0)
    .map((page) => ({ slug: page.slug }));
}

export function getTemplateRoutes(): string[] {
  return Object.values(templatePages).map((page) => page.routePath);
}

export function getNotFoundTemplate(): TemplatePageEntry | null {
  const definition = templatePages["404"];

  if (!definition) {
    return null;
  }

  return mapDefinitionToEntry(definition);
}

import { getTemplatePageBySlug } from "@/generated/template-registry";
import type { AdminCmsData } from "@/lib/admin/types";

export type CmsSubpageKey = "overview" | "home" | "router" | "sections" | "global";

export const cmsSubpages: Array<{
  key: CmsSubpageKey;
  href: string;
  label: string;
  description: string;
}> = [
  {
    key: "overview",
    href: "/admin/cms",
    label: "Overview",
    description: "CMS structure and quick actions",
  },
  {
    key: "home",
    href: "/admin/cms/home",
    label: "Home",
    description: "Home templates and Home 01 sections",
  },
  {
    key: "router",
    href: "/admin/cms/router",
    label: "Page Studio",
    description: "Visual page editor for slug, template, SEO, and content",
  },
  {
    key: "sections",
    href: "/admin/cms/sections",
    label: "Dynamic Sections",
    description: "Sections for cms_dynamic pages",
  },
  {
    key: "global",
    href: "/admin/cms/global",
    label: "Global Settings",
    description: "Branding, header, and footer",
  },
];

export function cmsStatusMessage(status?: string) {
  if (status === "home-template-saved") {
    return "Active home template updated.";
  }

  if (status === "home-sections-saved") {
    return "Home sections updated.";
  }

  if (status === "cms-pages-saved") {
    return "CMS pages and dynamic routes updated.";
  }

  if (status === "cms-page-saved") {
    return "Page settings updated.";
  }

  if (status === "home-content-saved") {
    return "Home SEO and content settings updated.";
  }

  if (status === "page-sections-saved") {
    return "Dynamic page sections updated.";
  }

  if (status === "global-settings-saved") {
    return "Global settings updated.";
  }

  return null;
}

export function buildCmsPageRows(cmsPages: AdminCmsData["cms_pages"], extraRows = 3) {
  const rows = [...cmsPages];

  for (let index = 0; index < extraRows; index += 1) {
    rows.push({
      page_key: "",
      template_key: "",
      slug: "",
      title: "",
      nav_label: "",
      nav_group: "",
      nav_order: 100 + index,
      show_in_nav: false,
      is_active: true,
      seo: {},
      content: {},
    });
  }

  return rows;
}

export function buildSectionRows(
  sections: Array<{
    sectionKey: string;
    name?: string | null;
    sortOrder: number;
    isEnabled: boolean;
    payload?: Record<string, unknown>;
  }> | undefined,
  extraRows = 2,
) {
  const rows = [...(sections ?? [])];

  for (let index = 0; index < extraRows; index += 1) {
    rows.push({
      sectionKey: "",
      name: "",
      sortOrder: 100 + index,
      isEnabled: true,
      payload: {},
    });
  }

  return rows;
}

export type CmsTemplateOption = {
  label?: string;
  description?: string;
};

export type CmsPageTemplateTarget = {
  page_key?: string | null;
  slug?: string | null;
  title?: string | null;
  template_key?: string | null;
};

export type CmsPageTemplateDefaults = {
  seo: Record<string, unknown>;
  content: Record<string, unknown>;
};

type TemplateScope = {
  key: string;
  label: string;
  description: string;
  allows: (templateKey: string) => boolean;
};

type TemplateOptionEntry = [string, CmsTemplateOption];
const LIST_VARIANT_TEMPLATE_NUMBERS = new Set([2, 4, 6, 8, 10, 12, 15, 17]);

function toHeadlineText(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (segment) => segment.toUpperCase());
}

function normalizePageIdentity(page: CmsPageTemplateTarget) {
  const source = `${page.page_key ?? ""} ${page.slug ?? ""} ${page.title ?? ""}`.toLowerCase();
  return source;
}

function buildTemplateScopes(): TemplateScope[] {
  return [
    {
      key: "home",
      label: "Home Templates",
      description: "Templates dedicated to homepage layouts.",
      allows: (templateKey) => templateKey === "home_01" || /^index-\d+$/.test(templateKey),
    },
    {
      key: "about",
      label: "About Page Templates",
      description: "Templates designed for About pages and company profile content.",
      allows: (templateKey) => /^about_us_\d+$/.test(templateKey),
    },
    {
      key: "blog",
      label: "Blog Templates",
      description: "Templates for blog index/list and article pages.",
      allows: (templateKey) =>
        templateKey === "blog_dynamic" || /^blog_\d+$/.test(templateKey) || templateKey === "blog_details",
    },
    {
      key: "listing",
      label: "Property Listing Templates",
      description: "Templates for property collection pages. Listing details layout is configured separately.",
      allows: (templateKey) =>
        templateKey === "listing_dynamic"
        || /^listing_\d+$/.test(templateKey)
        || templateKey === "compare",
    },
    {
      key: "agent",
      label: "Agent & Agency Templates",
      description: "Templates for agent and agency listing/detail pages.",
      allows: (templateKey) =>
        templateKey === "agent"
        || templateKey === "agent_details"
        || templateKey === "agency"
        || templateKey === "agency_details",
    },
    {
      key: "contact",
      label: "Contact Templates",
      description: "Templates for contact or inquiry focused pages.",
      allows: (templateKey) => templateKey === "contact",
    },
    {
      key: "faq",
      label: "FAQ Templates",
      description: "Templates for frequently asked questions pages.",
      allows: (templateKey) => templateKey === "faq",
    },
    {
      key: "project",
      label: "Project Templates",
      description: "Templates for project listing and project detail pages.",
      allows: (templateKey) => /^project_\d+$/.test(templateKey) || templateKey === "project_details_01",
    },
    {
      key: "service",
      label: "Service Templates",
      description: "Templates for services listing and service details pages.",
      allows: (templateKey) => /^service_\d+$/.test(templateKey) || templateKey === "service_details",
    },
    {
      key: "pricing",
      label: "Pricing Templates",
      description: "Templates designed for pricing and package pages.",
      allows: (templateKey) => /^pricing_\d+$/.test(templateKey),
    },
    {
      key: "general",
      label: "General Templates",
      description: "Flexible dynamic templates for custom content pages.",
      allows: (templateKey) => templateKey === "cms_dynamic",
    },
  ];
}

function detectPageScope(identity: string): string {
  if (identity.includes("home")) {
    return "home";
  }

  if (identity.includes("about")) {
    return "about";
  }

  if (identity.includes("blog") || identity.includes("news") || identity.includes("article")) {
    return "blog";
  }

  if (
    identity.includes("listing")
    || identity.includes("property")
    || identity.includes("properties")
    || identity.includes("estate")
  ) {
    return "listing";
  }

  if (identity.includes("agent") || identity.includes("agency") || identity.includes("team")) {
    return "agent";
  }

  if (identity.includes("contact") || identity.includes("inquiry")) {
    return "contact";
  }

  if (identity.includes("faq") || identity.includes("question")) {
    return "faq";
  }

  if (identity.includes("project")) {
    return "project";
  }

  if (identity.includes("service")) {
    return "service";
  }

  if (identity.includes("pricing") || identity.includes("plan")) {
    return "pricing";
  }

  return "general";
}

function resolveTemplateScopeForPage(page: CmsPageTemplateTarget): TemplateScope {
  const scopes = buildTemplateScopes();
  const identity = normalizePageIdentity(page);
  const scopeKey = detectPageScope(identity);

  return scopes.find((entry) => entry.key === scopeKey) ?? scopes.at(-1)!;
}

function sortTemplateEntries(templateOptions: Record<string, CmsTemplateOption>): TemplateOptionEntry[] {
  return Object.entries(templateOptions).sort((first, second) => {
    const firstLabel = first[1].label ?? first[0];
    const secondLabel = second[1].label ?? second[0];

    return firstLabel.localeCompare(secondLabel);
  });
}

export function isTemplateAllowedForPage(page: CmsPageTemplateTarget, templateKey: string): boolean {
  if (templateKey.trim() === "") {
    return false;
  }

  const scope = resolveTemplateScopeForPage(page);

  return scope.allows(templateKey);
}

function resolveScopeForPage(page: CmsPageTemplateTarget): TemplateScope {
  return resolveTemplateScopeForPage(page);
}

function inferPageDisplayTitle(page: CmsPageTemplateTarget): string {
  const explicitTitle = page.title?.trim();
  if (explicitTitle) {
    return explicitTitle;
  }

  const pageKey = page.page_key?.trim();
  if (pageKey) {
    return toHeadlineText(pageKey);
  }

  const slug = page.slug?.trim().replace(/^\/+|\/+$/g, "");
  if (slug) {
    return toHeadlineText(slug.split("/").at(-1) ?? slug);
  }

  return "Page";
}

function toListingTemplateNumber(templateKey: string | null | undefined): number | null {
  if (!templateKey) {
    return null;
  }

  const match = /^listing_(\d+)$/i.exec(templateKey.trim());
  if (!match) {
    return null;
  }

  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function toListingDetailsTemplateKey(templateKey: string | null | undefined): string {
  const normalized = (templateKey ?? "").trim().toLowerCase();

  if (/^listing_details_\d+$/i.test(normalized)) {
    return normalized;
  }

  const templateNumber = toListingTemplateNumber(normalized);
  if (templateNumber !== null && LIST_VARIANT_TEMPLATE_NUMBERS.has(templateNumber)) {
    return "listing_details_02";
  }

  return "listing_details_01";
}

function defaultSeoDescription(scopeKey: string) {
  if (scopeKey === "listing") {
    return "Browse featured homes and new property listings with rich details, images, and neighborhood insights.";
  }

  if (scopeKey === "blog") {
    return "Read the latest real estate tips, market insights, and local property stories from our editorial team.";
  }

  if (scopeKey === "agent") {
    return "Meet our verified real estate agents and connect with experts who can guide your next move.";
  }

  if (scopeKey === "contact") {
    return "Contact our real estate team for buying, selling, renting, and investment support.";
  }

  if (scopeKey === "about") {
    return "Learn about our mission, team, and how we help clients make confident property decisions.";
  }

  return "Explore premium real estate experiences with dynamic pages tailored to your audience.";
}

function defaultSeoKeywords(scopeKey: string): string[] {
  if (scopeKey === "listing") {
    return ["real estate", "property listings", "homes for sale", "homes for rent"];
  }

  if (scopeKey === "blog") {
    return ["real estate blog", "property advice", "market trends"];
  }

  if (scopeKey === "agent") {
    return ["real estate agents", "property experts", "agent directory"];
  }

  if (scopeKey === "contact") {
    return ["contact realtor", "property support", "real estate inquiry"];
  }

  if (scopeKey === "about") {
    return ["about real estate company", "our mission", "our team"];
  }

  return ["real estate", "property", "homes"];
}

export function resolvePageDefaults(
  page: CmsPageTemplateTarget,
  templateKeyOverride?: string,
): CmsPageTemplateDefaults {
  const scope = resolveScopeForPage(page);
  const pageTitle = inferPageDisplayTitle(page);
  const templateKey = (templateKeyOverride ?? page.template_key ?? "").trim().toLowerCase();

  const baseContent: Record<string, unknown> = {
    hero_title: pageTitle,
    hero_subtitle: "Design and publish this page with dynamic sections and editable CMS content.",
    intro_title: pageTitle,
    intro_text: "This section is fully editable from the admin panel.",
    primary_button_label: "Get Started",
    primary_button_link: "/contact",
    secondary_button_label: "Learn More",
    secondary_button_link: "/about-us",
  };

  if (scope.key === "listing") {
    const listingTemplateNumber = toListingTemplateNumber(templateKey);
    const listingLayout = listingTemplateNumber !== null && LIST_VARIANT_TEMPLATE_NUMBERS.has(listingTemplateNumber)
      ? "list"
      : "grid";

    return {
      seo: {
        title: `${pageTitle} | Home Real Estate`,
        description: defaultSeoDescription(scope.key),
        keywords: defaultSeoKeywords(scope.key),
        robots: {
          index: true,
          follow: true,
        },
      },
      content: {
        ...baseContent,
        hero_title: pageTitle === "Page" ? "Property Listings" : pageTitle,
        hero_subtitle: "Browse the latest available properties managed from your admin portal.",
        empty_message: "No published properties found yet. Add and publish listings from Admin.",
        sidebar_title: "Advanced Search",
        listing_label: "I'm looking to...",
        sort_by_label: "Sort by:",
        keyword_label: "Keyword",
        keyword_placeholder: "buy, home, loft, apartment",
        location_label: "Location",
        bedroom_label: "Bedroom",
        bath_label: "Bath",
        amenities_title: "Amenities",
        search_button_label: "Search",
        reset_filter_label: "Reset Filter",
        all_listings_label: "All Listings",
        for_sale_label: "For Sale",
        for_rent_label: "For Rent",
        featured_label: "Featured",
        any_label: "Any",
        listing_layout: listingLayout,
        details_template_key: toListingDetailsTemplateKey(templateKey),
        details_video_enabled: true,
        details_video_url: "https://creativegigstf.com/video/intro_4.mp4",
        details_back_label: "Back to Listings",
        details_price_label: "Price:",
        details_est_payment_label: "Est. Payment",
        details_share_label: "Share",
        details_overview_block_title: "Property Overview",
        details_overview_title: "Overview",
        details_overview_empty: "No description has been published for this property yet.",
        details_features_title: "Property Features",
        details_features_subtitle: "All key details are synced from your CMS-managed property records.",
        details_features_property_details_label: "Property Details",
        details_features_utility_details_label: "Utility Details",
        details_features_outdoor_features_label: "Outdoor Features",
        details_amenities_title: "Amenities",
        details_amenities_subtitle: "Feature sets below are dynamic and manageable from the admin property editor.",
        details_contact_button_label: "CONTACT AGENT",
        details_featured_listing_title: "Featured Listing",
        details_featured_listing_empty: "No featured properties available right now.",
        details_badge_sqft_label: "Sqft",
        details_badge_bed_label: "Bed",
        details_badge_bath_label: "Bath",
        details_badge_kitchen_label: "Kitchen",
        details_badge_type_label: "Type",
        mortgage_down_payment_percent: 20,
        mortgage_interest_rate: 3.5,
        mortgage_loan_years: 30,
        agent_position: "Property Agent & Broker",
        agent_email: "hello@homerealestate.com",
        agent_phone: "+1 (555) 123-9876",
        agent_avatar_path: "/images/agent/img_06.jpg",
      },
    };
  }

  if (scope.key === "blog") {
    return {
      seo: {
        title: `${pageTitle} | Home Real Estate`,
        description: defaultSeoDescription(scope.key),
        keywords: defaultSeoKeywords(scope.key),
        robots: {
          index: true,
          follow: true,
        },
      },
      content: {
        ...baseContent,
        hero_title: pageTitle === "Page" ? "Blog" : pageTitle,
        hero_subtitle: "Read insights and updates from our real estate experts.",
        empty_message: "No blog posts are published yet.",
      },
    };
  }

  if (scope.key === "agent") {
    return {
      seo: {
        title: `${pageTitle} | Home Real Estate`,
        description: defaultSeoDescription(scope.key),
        keywords: defaultSeoKeywords(scope.key),
        robots: {
          index: true,
          follow: true,
        },
      },
      content: {
        ...baseContent,
        hero_title: pageTitle === "Page" ? "Our Agents" : pageTitle,
        hero_subtitle: "Find trusted agents and connect directly for tailored property support.",
        empty_message: "No active agents found.",
      },
    };
  }

  return {
    seo: {
      title: `${pageTitle} | Home Real Estate`,
      description: defaultSeoDescription(scope.key),
      keywords: defaultSeoKeywords(scope.key),
      robots: {
        index: true,
        follow: true,
      },
    },
    content: baseContent,
  };
}

export function resolvePageTemplateChoices(
  page: CmsPageTemplateTarget,
  templateOptions: Record<string, CmsTemplateOption>,
) {
  const scope = resolveTemplateScopeForPage(page);
  const entries = sortTemplateEntries(templateOptions);
  const filtered = entries.filter(([templateKey]) => scope.allows(templateKey));
  const currentTemplateKey = (page.template_key ?? "").trim();
  const choices = filtered.length > 0
    ? filtered
    : entries.filter(([templateKey]) => templateKey === "cms_dynamic");
  const currentTemplateAllowed = choices.some(([templateKey]) => templateKey === currentTemplateKey);
  const selectedTemplateKey = currentTemplateAllowed
    ? currentTemplateKey
    : (choices[0]?.[0] ?? "");

  return {
    scopeLabel: scope.label,
    scopeDescription: scope.description,
    scopeKey: scope.key,
    choices,
    currentTemplateAllowed,
    selectedTemplateKey,
  };
}

export function inferTemplateCategory(templateKey: string) {
  const normalized = templateKey.toLowerCase();

  if (normalized === "cms_dynamic" || normalized === "listing_dynamic" || normalized === "blog_dynamic") {
    return "Dynamic";
  }

  if (normalized === "home_01" || normalized.startsWith("index-")) {
    return "Home";
  }

  if (normalized.startsWith("listing_") || normalized.startsWith("listing_details_")) {
    return "Listings";
  }

  if (normalized.startsWith("blog")) {
    return "Blog";
  }

  return "General";
}

export function templatePreviewPath(templateKey: string, slug?: string | null): string | null {
  if (templateKey === "home_01") {
    return "/";
  }

  if (templateKey === "cms_dynamic" || templateKey === "listing_dynamic" || templateKey === "blog_dynamic") {
    if (typeof slug === "string" && slug.trim() !== "") {
      return `/${slug.trim().replace(/^\/+|\/+$/g, "")}`;
    }

    return null;
  }

  const staticEntry = getTemplatePageBySlug([templateKey]);
  if (staticEntry) {
    return staticEntry.routePath;
  }

  if (typeof slug === "string" && slug.trim() !== "") {
    return `/${slug.trim().replace(/^\/+|\/+$/g, "")}`;
  }

  return null;
}

export function slugToPath(slug?: string | null) {
  if (!slug) {
    return "/";
  }

  const normalized = slug.trim().replace(/^\/+|\/+$/g, "");
  return normalized === "" ? "/" : `/${normalized}`;
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  updateAdminCmsPages,
  updateAdminGlobalSettings,
  updateAdminHomeSections,
  updateAdminHomeTemplate,
  updateAdminPageSections,
} from "@/lib/admin/backend-client";
import { requireAdminUser } from "@/lib/admin/auth";
import { isTemplateAllowedForPage } from "@/app/admin/(panel)/cms/shared";

type MutableSection = {
  section_key: string;
  name: string;
  sort_order: number;
  is_enabled: boolean;
  payload: Record<string, unknown>;
};

type MutableCmsPage = {
  page_key: string;
  template_key: string;
  slug: string;
  title: string;
  nav_label: string;
  nav_group: string;
  nav_order: number;
  show_in_nav: boolean;
  is_active: boolean;
  seo: Record<string, unknown>;
  content: Record<string, unknown>;
};

function safeRedirectTarget(target: string, fallback: string): string {
  const normalized = target.trim();

  if (!normalized.startsWith("/admin/cms")) {
    return fallback;
  }

  return normalized;
}

function resolveRedirectTarget(formData: FormData, fallback: string): string {
  return safeRedirectTarget(String(formData.get("redirect_to") ?? ""), fallback);
}

function withStatus(target: string, status: string): string {
  const separator = target.includes("?") ? "&" : "?";
  return `${target}${separator}status=${encodeURIComponent(status)}`;
}

function withError(target: string, error: string): string {
  const separator = target.includes("?") ? "&" : "?";
  return `${target}${separator}error=${encodeURIComponent(error)}`;
}

function parseJsonRecord(value: FormDataEntryValue | null): Record<string, unknown> {
  const raw = String(value ?? "").trim();

  if (raw === "") {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { ...(parsed as Record<string, unknown>) };
    }
  } catch {
    return {};
  }

  return {};
}

function readTrimmed(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function setNullableString(payload: Record<string, unknown>, key: string, value: string): void {
  if (value === "") {
    delete payload[key];
    return;
  }

  payload[key] = value;
}

function setNullableNumber(payload: Record<string, unknown>, key: string, value: string): void {
  if (value === "") {
    delete payload[key];
    return;
  }

  const normalized = Number(value);
  if (!Number.isFinite(normalized)) {
    delete payload[key];
    return;
  }

  payload[key] = normalized;
}

function setNullableBoolean(payload: Record<string, unknown>, key: string, value: string): void {
  if (value === "") {
    delete payload[key];
    return;
  }

  payload[key] = value === "1";
}

function applyNullableString(
  formData: FormData,
  payload: Record<string, unknown>,
  inputKey: string,
  payloadKey = inputKey,
) {
  if (!formData.has(inputKey)) {
    return;
  }

  setNullableString(payload, payloadKey, readTrimmed(formData, inputKey));
}

function applyNullableNumber(
  formData: FormData,
  payload: Record<string, unknown>,
  inputKey: string,
  payloadKey = inputKey,
) {
  if (!formData.has(inputKey)) {
    return;
  }

  setNullableNumber(payload, payloadKey, readTrimmed(formData, inputKey));
}

function applyNullableBoolean(
  formData: FormData,
  payload: Record<string, unknown>,
  inputKey: string,
  payloadKey = inputKey,
) {
  if (!formData.has(inputKey)) {
    return;
  }

  setNullableBoolean(payload, payloadKey, readTrimmed(formData, inputKey));
}

function buildSeoPayload(formData: FormData): Record<string, unknown> {
  const seo = parseJsonRecord(formData.get("seo_base_json"));

  setNullableString(seo, "title", readTrimmed(formData, "seo_title"));
  setNullableString(seo, "description", readTrimmed(formData, "seo_description"));

  const keywordsRaw = readTrimmed(formData, "seo_keywords");
  if (keywordsRaw === "") {
    delete seo.keywords;
  } else {
    const keywords = keywordsRaw
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");

    if (keywords.length > 0) {
      seo.keywords = keywords;
    } else {
      delete seo.keywords;
    }
  }

  const robots = (seo.robots && typeof seo.robots === "object" && !Array.isArray(seo.robots))
    ? { ...(seo.robots as Record<string, unknown>) }
    : {};

  const robotsIndex = readTrimmed(formData, "seo_robots_index");
  const robotsFollow = readTrimmed(formData, "seo_robots_follow");

  if (robotsIndex === "") {
    delete robots.index;
  } else {
    robots.index = robotsIndex === "1";
  }

  if (robotsFollow === "") {
    delete robots.follow;
  } else {
    robots.follow = robotsFollow === "1";
  }

  if (Object.keys(robots).length > 0) {
    seo.robots = robots;
  } else {
    delete seo.robots;
  }

  return seo;
}

function buildContentPayload(formData: FormData): Record<string, unknown> {
  const content = parseJsonRecord(formData.get("content_base_json"));

  applyNullableString(formData, content, "content_hero_title", "hero_title");
  applyNullableString(formData, content, "content_hero_subtitle", "hero_subtitle");
  applyNullableString(formData, content, "content_intro_title", "intro_title");
  applyNullableString(formData, content, "content_intro_text", "intro_text");
  applyNullableString(formData, content, "content_primary_button_label", "primary_button_label");
  applyNullableString(formData, content, "content_primary_button_link", "primary_button_link");
  applyNullableString(formData, content, "content_secondary_button_label", "secondary_button_label");
  applyNullableString(formData, content, "content_secondary_button_link", "secondary_button_link");

  applyNullableString(formData, content, "content_empty_message", "empty_message");
  applyNullableString(formData, content, "content_sidebar_title", "sidebar_title");
  applyNullableString(formData, content, "content_listing_label", "listing_label");
  applyNullableString(formData, content, "content_sort_by_label", "sort_by_label");
  applyNullableString(formData, content, "content_keyword_label", "keyword_label");
  applyNullableString(formData, content, "content_keyword_placeholder", "keyword_placeholder");
  applyNullableString(formData, content, "content_location_label", "location_label");
  applyNullableString(formData, content, "content_bedroom_label", "bedroom_label");
  applyNullableString(formData, content, "content_bath_label", "bath_label");
  applyNullableString(formData, content, "content_amenities_title", "amenities_title");
  applyNullableString(formData, content, "content_search_button_label", "search_button_label");
  applyNullableString(formData, content, "content_reset_filter_label", "reset_filter_label");
  applyNullableString(formData, content, "content_all_listings_label", "all_listings_label");
  applyNullableString(formData, content, "content_for_sale_label", "for_sale_label");
  applyNullableString(formData, content, "content_for_rent_label", "for_rent_label");
  applyNullableString(formData, content, "content_featured_label", "featured_label");
  applyNullableString(formData, content, "content_any_label", "any_label");
  applyNullableString(formData, content, "content_listing_layout", "listing_layout");
  applyNullableNumber(formData, content, "content_per_page", "per_page");
  applyNullableBoolean(formData, content, "content_featured_only", "featured_only");
  applyNullableString(formData, content, "content_sort", "sort");

  applyNullableString(formData, content, "content_details_template_key", "details_template_key");
  applyNullableBoolean(formData, content, "content_details_video_enabled", "details_video_enabled");
  applyNullableString(formData, content, "content_details_video_url", "details_video_url");
  applyNullableString(formData, content, "content_details_back_label", "details_back_label");
  applyNullableString(formData, content, "content_details_price_label", "details_price_label");
  applyNullableString(formData, content, "content_details_est_payment_label", "details_est_payment_label");
  applyNullableString(formData, content, "content_details_share_label", "details_share_label");
  applyNullableString(formData, content, "content_details_overview_block_title", "details_overview_block_title");
  applyNullableString(formData, content, "content_details_overview_title", "details_overview_title");
  applyNullableString(formData, content, "content_details_overview_empty", "details_overview_empty");
  applyNullableString(formData, content, "content_details_features_title", "details_features_title");
  applyNullableString(formData, content, "content_details_features_subtitle", "details_features_subtitle");
  applyNullableString(
    formData,
    content,
    "content_details_features_property_details_label",
    "details_features_property_details_label",
  );
  applyNullableString(
    formData,
    content,
    "content_details_features_utility_details_label",
    "details_features_utility_details_label",
  );
  applyNullableString(
    formData,
    content,
    "content_details_features_outdoor_features_label",
    "details_features_outdoor_features_label",
  );
  applyNullableString(formData, content, "content_details_amenities_title", "details_amenities_title");
  applyNullableString(formData, content, "content_details_amenities_subtitle", "details_amenities_subtitle");
  applyNullableString(formData, content, "content_details_contact_button_label", "details_contact_button_label");
  applyNullableString(formData, content, "content_details_featured_listing_title", "details_featured_listing_title");
  applyNullableString(formData, content, "content_details_featured_listing_empty", "details_featured_listing_empty");
  applyNullableString(formData, content, "content_details_badge_sqft_label", "details_badge_sqft_label");
  applyNullableString(formData, content, "content_details_badge_bed_label", "details_badge_bed_label");
  applyNullableString(formData, content, "content_details_badge_bath_label", "details_badge_bath_label");
  applyNullableString(formData, content, "content_details_badge_kitchen_label", "details_badge_kitchen_label");
  applyNullableString(formData, content, "content_details_badge_type_label", "details_badge_type_label");

  applyNullableNumber(formData, content, "content_mortgage_down_payment_percent", "mortgage_down_payment_percent");
  applyNullableNumber(formData, content, "content_mortgage_interest_rate", "mortgage_interest_rate");
  applyNullableNumber(formData, content, "content_mortgage_loan_years", "mortgage_loan_years");

  applyNullableString(formData, content, "content_agent_position", "agent_position");
  applyNullableString(formData, content, "content_agent_email", "agent_email");
  applyNullableString(formData, content, "content_agent_phone", "agent_phone");
  applyNullableString(formData, content, "content_agent_avatar_path", "agent_avatar_path");
  applyNullableString(formData, content, "content_agent_location", "agent_location");

  return content;
}

function revalidateCmsAdminPaths(): void {
  revalidatePath("/admin/cms");
  revalidatePath("/admin/cms/home");
  revalidatePath("/admin/cms/router");
  revalidatePath("/admin/cms/sections");
  revalidatePath("/admin/cms/global");
}

function redirectWithError(error: string, target = "/admin/cms"): never {
  redirect(withError(target, error));
}

export async function saveHomeTemplateAction(formData: FormData) {
  await requireAdminUser();
  const redirectTarget = resolveRedirectTarget(formData, "/admin/cms/home");

  const homeTemplate = String(formData.get("home_template") ?? "").trim();

  if (!homeTemplate) {
    redirectWithError("Home template is required.", redirectTarget);
  }

  const response = await updateAdminHomeTemplate(homeTemplate);

  if (!response.ok) {
    redirectWithError(response.message ?? "Failed to update home template.", redirectTarget);
  }

  revalidateCmsAdminPaths();
  redirect(withStatus(redirectTarget, "home-template-saved"));
}

export async function saveHomeSectionsAction(formData: FormData) {
  await requireAdminUser();
  const redirectTarget = resolveRedirectTarget(formData, "/admin/cms/home");

  const sectionMap = new Map<string, MutableSection>();
  const sectionKeyPattern = /^sections\[(\d+)\]\[(.+)\]$/;

  for (const [key, value] of formData.entries()) {
    const matches = key.match(sectionKeyPattern);

    if (!matches) {
      continue;
    }

    const sectionIndex = matches[1];
    const field = matches[2];
    const entry = sectionMap.get(sectionIndex) ?? {
      section_key: "",
      name: "",
      sort_order: 0,
      is_enabled: true,
      payload: {},
    };

    const fieldValue = String(value ?? "");

    if (field === "section_key") {
      entry.section_key = fieldValue.trim();
    } else if (field === "name") {
      entry.name = fieldValue.trim();
    } else if (field === "sort_order") {
      entry.sort_order = Number.parseInt(fieldValue, 10) || 0;
    } else if (field === "is_enabled") {
      entry.is_enabled = fieldValue === "1";
    } else if (field === "payload") {
      if (!fieldValue.trim()) {
        entry.payload = {};
      } else {
        try {
          const parsedPayload = JSON.parse(fieldValue);
          entry.payload = typeof parsedPayload === "object" && parsedPayload !== null
            ? parsedPayload as Record<string, unknown>
            : {};
        } catch {
          redirectWithError(`Invalid JSON payload in section: ${entry.section_key || sectionIndex}`, redirectTarget);
        }
      }
    }

    sectionMap.set(sectionIndex, entry);
  }

  const sections = [...sectionMap.values()]
    .filter((section) => section.section_key !== "")
    .sort((first, second) => first.sort_order - second.sort_order);

  if (sections.length === 0) {
    redirectWithError("At least one section is required.", redirectTarget);
  }

  const response = await updateAdminHomeSections(sections);

  if (!response.ok) {
    redirectWithError(response.message ?? "Failed to update home sections.", redirectTarget);
  }

  revalidateCmsAdminPaths();
  redirect(withStatus(redirectTarget, "home-sections-saved"));
}

export async function savePageSectionsAction(formData: FormData) {
  await requireAdminUser();
  const redirectTarget = resolveRedirectTarget(formData, "/admin/cms/sections");

  const sectionPattern = /^page_sections\[([a-z0-9\-_]+)\]\[(\d+)\]\[(.+)\]$/;
  const pages = new Map<string, Map<string, MutableSection>>();

  for (const [key, value] of formData.entries()) {
    const matches = key.match(sectionPattern);

    if (!matches) {
      continue;
    }

    const pageKey = matches[1];
    const sectionIndex = matches[2];
    const field = matches[3];

    const pageSections = pages.get(pageKey) ?? new Map<string, MutableSection>();
    const entry = pageSections.get(sectionIndex) ?? {
      section_key: "",
      name: "",
      sort_order: 0,
      is_enabled: true,
      payload: {},
    };

    const fieldValue = String(value ?? "");

    if (field === "section_key") {
      entry.section_key = fieldValue.trim();
    } else if (field === "name") {
      entry.name = fieldValue.trim();
    } else if (field === "sort_order") {
      entry.sort_order = Number.parseInt(fieldValue, 10) || 0;
    } else if (field === "is_enabled") {
      entry.is_enabled = fieldValue === "1";
    } else if (field === "payload") {
      if (!fieldValue.trim()) {
        entry.payload = {};
      } else {
        try {
          const parsedPayload = JSON.parse(fieldValue);
          entry.payload = typeof parsedPayload === "object" && parsedPayload !== null
            ? parsedPayload as Record<string, unknown>
            : {};
        } catch {
          redirectWithError(
            `Invalid section payload JSON for page ${pageKey}, section ${entry.section_key || sectionIndex}`,
            redirectTarget,
          );
        }
      }
    }

    pageSections.set(sectionIndex, entry);
    pages.set(pageKey, pageSections);
  }

  const payload = [...pages.entries()]
    .map(([page_key, sectionMap]) => ({
      page_key,
      sections: [...sectionMap.values()]
        .filter((section) => section.section_key !== "")
        .sort((first, second) => first.sort_order - second.sort_order),
    }))
    .filter((entry) => entry.sections.length > 0);

  if (payload.length === 0) {
    redirectWithError("At least one dynamic section is required.", redirectTarget);
  }

  const response = await updateAdminPageSections(payload);

  if (!response.ok) {
    redirectWithError(response.message ?? "Failed to update page sections.", redirectTarget);
  }

  revalidateCmsAdminPaths();
  revalidatePath("/");
  redirect(withStatus(redirectTarget, "page-sections-saved"));
}

export async function saveCmsPageStudioAction(formData: FormData) {
  await requireAdminUser();

  const pageKey = readTrimmed(formData, "page_key").toLowerCase();
  const pageTitle = readTrimmed(formData, "title");
  const templateKey = readTrimmed(formData, "template_key");
  const slug = readTrimmed(formData, "slug").replace(/^\/+|\/+$/g, "").toLowerCase();
  const redirectFallback = pageKey === ""
    ? "/admin/cms/router"
    : `/admin/cms/router?page=${encodeURIComponent(pageKey)}`;
  const redirectTarget = resolveRedirectTarget(formData, redirectFallback);

  if (!/^[a-z0-9\-_]+$/.test(pageKey)) {
    redirectWithError("Page key is required and can use only lowercase letters, numbers, hyphen, and underscore.", redirectTarget);
  }

  if (templateKey === "") {
    redirectWithError("Template is required.", redirectTarget);
  }

  if (!isTemplateAllowedForPage({ page_key: pageKey, slug, title: pageTitle }, templateKey)) {
    redirectWithError("Selected template is not allowed for this page type.", redirectTarget);
  }

  if (slug !== "" && !/^[a-z0-9]+(?:[-_][a-z0-9]+)*(?:\/[a-z0-9]+(?:[-_][a-z0-9]+)*)*$/.test(slug)) {
    redirectWithError("Slug format is invalid.", redirectTarget);
  }

  const navOrderRaw = readTrimmed(formData, "nav_order");
  const navOrderParsed = Number.parseInt(navOrderRaw, 10);
  const navOrder = Number.isInteger(navOrderParsed) && navOrderParsed >= 0 ? navOrderParsed : 0;

  const payload = {
    page_key: pageKey,
    template_key: templateKey,
    slug,
    title: pageTitle,
    nav_label: readTrimmed(formData, "nav_label"),
    nav_group: readTrimmed(formData, "nav_group"),
    nav_order: navOrder,
    show_in_nav: readTrimmed(formData, "show_in_nav") === "1",
    is_active: readTrimmed(formData, "is_active") !== "0",
    seo: buildSeoPayload(formData),
    content: buildContentPayload(formData),
  };

  const response = await updateAdminCmsPages([payload]);

  if (!response.ok) {
    redirectWithError(response.message ?? "Failed to update page settings.", redirectTarget);
  }

  revalidateCmsAdminPaths();
  revalidatePath("/");
  redirect(withStatus(`/admin/cms/router?page=${encodeURIComponent(pageKey)}`, "cms-page-saved"));
}

export async function saveHomeContentAction(formData: FormData) {
  await requireAdminUser();
  const redirectTarget = resolveRedirectTarget(formData, "/admin/cms/home");
  const homeTemplateKey = readTrimmed(formData, "home_template_key") || "home_01";

  const payload = {
    page_key: "home",
    template_key: homeTemplateKey,
    slug: "",
    title: readTrimmed(formData, "title") || "Home",
    nav_label: "",
    nav_group: "system",
    nav_order: 0,
    show_in_nav: false,
    is_active: true,
    seo: buildSeoPayload(formData),
    content: buildContentPayload(formData),
  };

  const response = await updateAdminCmsPages([payload]);

  if (!response.ok) {
    redirectWithError(response.message ?? "Failed to update home settings.", redirectTarget);
  }

  revalidateCmsAdminPaths();
  revalidatePath("/");
  redirect(withStatus(redirectTarget, "home-content-saved"));
}

export async function saveCmsPagesAction(formData: FormData) {
  await requireAdminUser();
  const redirectTarget = resolveRedirectTarget(formData, "/admin/cms/router");

  const pageMap = new Map<string, MutableCmsPage>();
  const pageKeyPattern = /^pages\[(\d+)\]\[(.+)\]$/;

  for (const [key, value] of formData.entries()) {
    const matches = key.match(pageKeyPattern);

    if (!matches) {
      continue;
    }

    const pageIndex = matches[1];
    const field = matches[2];
    const entry = pageMap.get(pageIndex) ?? {
      page_key: "",
      template_key: "",
      slug: "",
      title: "",
      nav_label: "",
      nav_group: "",
      nav_order: 0,
      show_in_nav: false,
      is_active: true,
      seo: {},
      content: {},
    };

    const fieldValue = String(value ?? "");

    if (field === "page_key") {
      entry.page_key = fieldValue.trim().toLowerCase();
    } else if (field === "template_key") {
      entry.template_key = fieldValue.trim();
    } else if (field === "slug") {
      entry.slug = fieldValue.trim().replace(/^\/+|\/+$/g, "").toLowerCase();
    } else if (field === "title") {
      entry.title = fieldValue.trim();
    } else if (field === "nav_label") {
      entry.nav_label = fieldValue.trim();
    } else if (field === "nav_group") {
      entry.nav_group = fieldValue.trim();
    } else if (field === "nav_order") {
      entry.nav_order = Number.parseInt(fieldValue, 10) || 0;
    } else if (field === "show_in_nav") {
      entry.show_in_nav = fieldValue === "1";
    } else if (field === "is_active") {
      entry.is_active = fieldValue === "1";
    } else if (field === "seo") {
      if (!fieldValue.trim()) {
        entry.seo = {};
      } else {
        try {
          const parsedSeo = JSON.parse(fieldValue);
          entry.seo = typeof parsedSeo === "object" && parsedSeo !== null
            ? parsedSeo as Record<string, unknown>
            : {};
        } catch {
          redirectWithError(`Invalid SEO JSON for page: ${entry.page_key || pageIndex}`, redirectTarget);
        }
      }
    } else if (field === "content") {
      if (!fieldValue.trim()) {
        entry.content = {};
      } else {
        try {
          const parsedContent = JSON.parse(fieldValue);
          entry.content = typeof parsedContent === "object" && parsedContent !== null
            ? parsedContent as Record<string, unknown>
            : {};
        } catch {
          redirectWithError(`Invalid content JSON for page: ${entry.page_key || pageIndex}`, redirectTarget);
        }
      }
    }

    pageMap.set(pageIndex, entry);
  }

  const pages = [...pageMap.values()]
    .filter((page) => page.page_key !== "" && page.template_key !== "")
    .sort((first, second) => first.nav_order - second.nav_order);

  if (pages.length === 0) {
    redirectWithError("At least one CMS page is required.", redirectTarget);
  }

  for (const page of pages) {
    if (!isTemplateAllowedForPage(page, page.template_key)) {
      redirectWithError(`Template ${page.template_key} is not allowed for page ${page.page_key}.`, redirectTarget);
    }
  }

  const response = await updateAdminCmsPages(pages);

  if (!response.ok) {
    redirectWithError(response.message ?? "Failed to update CMS pages.", redirectTarget);
  }

  revalidateCmsAdminPaths();
  revalidatePath("/");
  redirect(withStatus(redirectTarget, "cms-pages-saved"));
}

export async function saveGlobalSettingsAction(formData: FormData) {
  await requireAdminUser();
  const redirectTarget = resolveRedirectTarget(formData, "/admin/cms/global");

  const footerEmail = String(formData.get("footer_email") ?? "").trim();

  const payload = {
    branding: {
      site_name: String(formData.get("branding_site_name") ?? "").trim(),
      logo_path: String(formData.get("branding_logo_path") ?? "").trim(),
      logo_alt: String(formData.get("branding_logo_alt") ?? "").trim(),
    },
    header: {
      announcement_text: String(formData.get("header_announcement_text") ?? "").trim(),
      announcement_link: String(formData.get("header_announcement_link") ?? "").trim(),
      home_nav_label: String(formData.get("header_home_nav_label") ?? "").trim(),
      login_label: String(formData.get("header_login_label") ?? "").trim(),
      add_listing_label: String(formData.get("header_add_listing_label") ?? "").trim(),
      add_listing_link: String(formData.get("header_add_listing_link") ?? "").trim(),
    },
    footer: {
      address: String(formData.get("footer_address") ?? "").trim(),
      email: footerEmail !== "" ? footerEmail : undefined,
      copyright_text: String(formData.get("footer_copyright_text") ?? "").trim(),
    },
  };

  const response = await updateAdminGlobalSettings(payload);

  if (!response.ok) {
    redirectWithError(response.message ?? "Failed to update global settings.", redirectTarget);
  }

  revalidateCmsAdminPaths();
  redirect(withStatus(redirectTarget, "global-settings-saved"));
}

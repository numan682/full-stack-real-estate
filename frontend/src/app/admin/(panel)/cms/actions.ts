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

function redirectWithError(error: string): never {
  redirect(`/admin/cms?error=${encodeURIComponent(error)}`);
}

export async function saveHomeTemplateAction(formData: FormData) {
  await requireAdminUser();

  const homeTemplate = String(formData.get("home_template") ?? "").trim();

  if (!homeTemplate) {
    redirectWithError("Home template is required.");
  }

  const response = await updateAdminHomeTemplate(homeTemplate);

  if (!response.ok) {
    redirectWithError(response.message ?? "Failed to update home template.");
  }

  revalidatePath("/admin/cms");
  redirect("/admin/cms?status=home-template-saved");
}

export async function saveHomeSectionsAction(formData: FormData) {
  await requireAdminUser();

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
          redirectWithError(`Invalid JSON payload in section: ${entry.section_key || sectionIndex}`);
        }
      }
    }

    sectionMap.set(sectionIndex, entry);
  }

  const sections = [...sectionMap.values()]
    .filter((section) => section.section_key !== "")
    .sort((first, second) => first.sort_order - second.sort_order);

  if (sections.length === 0) {
    redirectWithError("At least one section is required.");
  }

  const response = await updateAdminHomeSections(sections);

  if (!response.ok) {
    redirectWithError(response.message ?? "Failed to update home sections.");
  }

  revalidatePath("/admin/cms");
  redirect("/admin/cms?status=home-sections-saved");
}

export async function savePageSectionsAction(formData: FormData) {
  await requireAdminUser();

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
          redirectWithError(`Invalid section payload JSON for page ${pageKey}, section ${entry.section_key || sectionIndex}`);
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
    redirectWithError("At least one dynamic section is required.");
  }

  const response = await updateAdminPageSections(payload);

  if (!response.ok) {
    redirectWithError(response.message ?? "Failed to update page sections.");
  }

  revalidatePath("/admin/cms");
  revalidatePath("/");
  redirect("/admin/cms?status=page-sections-saved");
}

export async function saveCmsPagesAction(formData: FormData) {
  await requireAdminUser();

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
          redirectWithError(`Invalid SEO JSON for page: ${entry.page_key || pageIndex}`);
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
          redirectWithError(`Invalid content JSON for page: ${entry.page_key || pageIndex}`);
        }
      }
    }

    pageMap.set(pageIndex, entry);
  }

  const pages = [...pageMap.values()]
    .filter((page) => page.page_key !== "" && page.template_key !== "")
    .sort((first, second) => first.nav_order - second.nav_order);

  if (pages.length === 0) {
    redirectWithError("At least one CMS page is required.");
  }

  const response = await updateAdminCmsPages(pages);

  if (!response.ok) {
    redirectWithError(response.message ?? "Failed to update CMS pages.");
  }

  revalidatePath("/admin/cms");
  revalidatePath("/");
  redirect("/admin/cms?status=cms-pages-saved");
}

export async function saveGlobalSettingsAction(formData: FormData) {
  await requireAdminUser();

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
    redirectWithError(response.message ?? "Failed to update global settings.");
  }

  revalidatePath("/admin/cms");
  redirect("/admin/cms?status=global-settings-saved");
}

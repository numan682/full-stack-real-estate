import Link from "next/link";
import { saveCmsPageStudioAction } from "@/app/admin/(panel)/cms/actions";
import { CmsSettingsNav } from "@/app/admin/(panel)/cms/cms-settings-nav";
import {
  cmsStatusMessage,
  inferTemplateCategory,
  resolvePageDefaults,
  resolvePageTemplateChoices,
  slugToPath,
  templatePreviewPath,
} from "@/app/admin/(panel)/cms/shared";
import type { AdminCmsData } from "@/lib/admin/types";
import { fetchAdminCms } from "@/lib/admin/backend-client";

type CmsRouterPageProps = {
  searchParams: Promise<{
    status?: string;
    error?: string;
    page?: string;
  }>;
};

type ContentField = {
  inputName: string;
  contentKey: string;
  label: string;
  span: number;
  multiline?: boolean;
  numeric?: boolean;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  fallback?: string;
};

const LISTING_TEXT_FIELDS: ContentField[] = [
  { inputName: "content_sidebar_title", contentKey: "sidebar_title", label: "Sidebar Title", span: 3 },
  { inputName: "content_listing_label", contentKey: "listing_label", label: "Listing Type Label", span: 3 },
  { inputName: "content_sort_by_label", contentKey: "sort_by_label", label: "Sort Label", span: 3 },
  { inputName: "content_keyword_label", contentKey: "keyword_label", label: "Keyword Label", span: 3 },
  { inputName: "content_keyword_placeholder", contentKey: "keyword_placeholder", label: "Keyword Placeholder", span: 6 },
  { inputName: "content_location_label", contentKey: "location_label", label: "Location Label", span: 3 },
  { inputName: "content_bedroom_label", contentKey: "bedroom_label", label: "Bedroom Label", span: 3 },
  { inputName: "content_bath_label", contentKey: "bath_label", label: "Bath Label", span: 3 },
  { inputName: "content_amenities_title", contentKey: "amenities_title", label: "Amenities Heading", span: 3 },
  { inputName: "content_search_button_label", contentKey: "search_button_label", label: "Search Button", span: 3 },
  { inputName: "content_reset_filter_label", contentKey: "reset_filter_label", label: "Reset Button", span: 3 },
  { inputName: "content_all_listings_label", contentKey: "all_listings_label", label: "All Listings Label", span: 2 },
  { inputName: "content_for_sale_label", contentKey: "for_sale_label", label: "For Sale Label", span: 2 },
  { inputName: "content_for_rent_label", contentKey: "for_rent_label", label: "For Rent Label", span: 2 },
  { inputName: "content_featured_label", contentKey: "featured_label", label: "Featured Label", span: 2 },
  { inputName: "content_any_label", contentKey: "any_label", label: "Any Label", span: 2 },
];

const DETAIL_TEXT_FIELDS: ContentField[] = [
  { inputName: "content_details_back_label", contentKey: "details_back_label", label: "Back Button Label", span: 3 },
  { inputName: "content_details_price_label", contentKey: "details_price_label", label: "Price Label", span: 3 },
  { inputName: "content_details_est_payment_label", contentKey: "details_est_payment_label", label: "Estimate Label", span: 3 },
  { inputName: "content_details_share_label", contentKey: "details_share_label", label: "Share Label", span: 3 },
  { inputName: "content_details_overview_block_title", contentKey: "details_overview_block_title", label: "Overview Block Title", span: 4 },
  { inputName: "content_details_overview_title", contentKey: "details_overview_title", label: "Overview Title", span: 4 },
  { inputName: "content_details_overview_empty", contentKey: "details_overview_empty", label: "Overview Empty Text", span: 4 },
  { inputName: "content_details_features_title", contentKey: "details_features_title", label: "Features Section Title", span: 6 },
  { inputName: "content_details_features_subtitle", contentKey: "details_features_subtitle", label: "Features Section Subtitle", span: 6 },
  { inputName: "content_details_features_property_details_label", contentKey: "details_features_property_details_label", label: "Accordion: Property Details", span: 4 },
  { inputName: "content_details_features_utility_details_label", contentKey: "details_features_utility_details_label", label: "Accordion: Utility Details", span: 4 },
  { inputName: "content_details_features_outdoor_features_label", contentKey: "details_features_outdoor_features_label", label: "Accordion: Outdoor Features", span: 4 },
  { inputName: "content_details_amenities_title", contentKey: "details_amenities_title", label: "Amenities Title", span: 6 },
  { inputName: "content_details_amenities_subtitle", contentKey: "details_amenities_subtitle", label: "Amenities Subtitle", span: 6 },
  { inputName: "content_details_featured_listing_title", contentKey: "details_featured_listing_title", label: "Featured Listing Title", span: 4 },
  { inputName: "content_details_featured_listing_empty", contentKey: "details_featured_listing_empty", label: "Featured Listing Empty Text", span: 4 },
  { inputName: "content_details_contact_button_label", contentKey: "details_contact_button_label", label: "Contact Agent Button", span: 4 },
  { inputName: "content_details_badge_sqft_label", contentKey: "details_badge_sqft_label", label: "Badge: Sqft", span: 2 },
  { inputName: "content_details_badge_bed_label", contentKey: "details_badge_bed_label", label: "Badge: Bed", span: 2 },
  { inputName: "content_details_badge_bath_label", contentKey: "details_badge_bath_label", label: "Badge: Bath", span: 2 },
  { inputName: "content_details_badge_kitchen_label", contentKey: "details_badge_kitchen_label", label: "Badge: Kitchen", span: 3 },
  { inputName: "content_details_badge_type_label", contentKey: "details_badge_type_label", label: "Badge: Type", span: 3 },
];

const AGENT_FIELDS: ContentField[] = [
  { inputName: "content_agent_position", contentKey: "agent_position", label: "Agent Position", span: 4 },
  { inputName: "content_agent_email", contentKey: "agent_email", label: "Agent Email", span: 4 },
  { inputName: "content_agent_phone", contentKey: "agent_phone", label: "Agent Phone", span: 4 },
  { inputName: "content_agent_avatar_path", contentKey: "agent_avatar_path", label: "Agent Avatar Path", span: 6 },
  { inputName: "content_agent_location", contentKey: "agent_location", label: "Agent Location", span: 6 },
];

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function toStringValue(value: unknown, fallback = ""): string {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim() !== "" ? value : fallback;
}

function toNumberValue(value: unknown, fallback = ""): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? String(parsed) : fallback;
  }

  return fallback;
}

function toBooleanSelect(value: unknown): string {
  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }

  if (typeof value === "string") {
    if (["1", "true", "yes", "on"].includes(value.toLowerCase())) {
      return "1";
    }

    if (["0", "false", "no", "off"].includes(value.toLowerCase())) {
      return "0";
    }
  }

  return "";
}

function toKeywordsInput(value: unknown): string {
  if (typeof value === "string" && value.trim() !== "") {
    return value;
  }

  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .filter((item): item is string => typeof item === "string" && item.trim() !== "")
    .join(", ");
}

function shouldKeepOverride(value: unknown) {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim() !== "";
  }

  return true;
}

function mergeDefaults(defaults: Record<string, unknown>, overrides: Record<string, unknown>) {
  const merged: Record<string, unknown> = { ...defaults };

  for (const [key, value] of Object.entries(overrides)) {
    if (shouldKeepOverride(value)) {
      merged[key] = value;
    }
  }

  return merged;
}

function mergeSeoDefaults(defaults: Record<string, unknown>, overrides: Record<string, unknown>) {
  const merged = mergeDefaults(defaults, overrides);
  const mergedRobots = mergeDefaults(toRecord(defaults.robots), toRecord(overrides.robots));

  if (Object.keys(mergedRobots).length > 0) {
    merged.robots = mergedRobots;
  } else {
    delete merged.robots;
  }

  return merged;
}

function toHeadline(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (segment) => segment.toUpperCase());
}

function defaultNewPage(navOrder: number): AdminCmsData["cms_pages"][number] {
  return {
    page_key: "",
    template_key: "cms_dynamic",
    slug: "",
    title: "",
    nav_label: "",
    nav_group: "main",
    nav_order: navOrder,
    show_in_nav: true,
    is_active: true,
    seo: {},
    content: {},
  };
}

function renderContentField(field: ContentField, content: Record<string, unknown>) {
  const defaultValue = field.numeric
    ? toNumberValue(content[field.contentKey], field.fallback ?? "")
    : toStringValue(content[field.contentKey], field.fallback ?? "");

  return (
    <div className="admin-field" style={{ gridColumn: `span ${field.span}` }} key={field.inputName}>
      <label htmlFor={field.inputName}>{field.label}</label>
      {field.multiline ? (
        <textarea id={field.inputName} name={field.inputName} defaultValue={defaultValue} placeholder={field.placeholder} />
      ) : (
        <input
          id={field.inputName}
          name={field.inputName}
          type={field.numeric ? "number" : "text"}
          min={field.min}
          max={field.max}
          step={field.step}
          defaultValue={defaultValue}
          placeholder={field.placeholder}
        />
      )}
    </div>
  );
}

export default async function AdminCmsRouterPage({ searchParams }: CmsRouterPageProps) {
  const query = await searchParams;
  const response = await fetchAdminCms();

  if (!response.ok || !response.data) {
    return (
      <section>
        <h2 className="admin-title">CMS Page Studio</h2>
        <div className="admin-flash error">{response.message ?? "Failed to load CMS data."}</div>
      </section>
    );
  }

  const status = cmsStatusMessage(query.status);
  const selectedPageKey = String(query.page ?? "").trim().toLowerCase();
  const {
    template_options: templateOptions,
    cms_pages: cmsPages,
  } = response.data;

  const manageablePages = cmsPages.filter((page) => page.page_key !== "home");
  const sortedPages = [...manageablePages].sort((first, second) => {
    if (first.nav_order !== second.nav_order) {
      return first.nav_order - second.nav_order;
    }

    return first.page_key.localeCompare(second.page_key);
  });

  const nextNavOrder = (sortedPages.at(-1)?.nav_order ?? 0) + 10;
  const selectedExistingPage = sortedPages.find((page) => page.page_key === selectedPageKey);
  const isNewPage = selectedPageKey === "new" || (selectedExistingPage === undefined && sortedPages.length === 0);
  const currentPage = selectedExistingPage
    ?? (isNewPage ? defaultNewPage(nextNavOrder) : (sortedPages[0] ?? defaultNewPage(nextNavOrder)));
  const currentSeo = toRecord(currentPage.seo);
  const currentContent = toRecord(currentPage.content);
  const templateChoiceState = resolvePageTemplateChoices(currentPage, templateOptions);
  const currentTemplateKey = templateChoiceState.selectedTemplateKey || currentPage.template_key || "cms_dynamic";
  const pageDefaults = resolvePageDefaults({ ...currentPage, template_key: currentTemplateKey }, currentTemplateKey);
  const resolvedSeo = mergeSeoDefaults(toRecord(pageDefaults.seo), currentSeo);
  const resolvedContent = mergeDefaults(toRecord(pageDefaults.content), currentContent);
  const currentTemplate = templateOptions[currentTemplateKey];
  const previewPath = templatePreviewPath(currentTemplateKey, currentPage.slug);
  const isListingScope = templateChoiceState.scopeKey === "listing";
  const isCollectionScope = ["listing", "blog", "agent"].includes(templateChoiceState.scopeKey);
  const selectedRobots = toRecord(resolvedSeo.robots);
  const redirectTarget = currentPage.page_key !== ""
    ? `/admin/cms/router?page=${encodeURIComponent(currentPage.page_key)}`
    : "/admin/cms/router?page=new";

  return (
    <section>
      <h2 className="admin-title">CMS Page Studio</h2>
      <p className="admin-subtitle">Select a page, choose a template, and update slug, SEO, and content from visual fields.</p>

      <CmsSettingsNav active="router" />

      {status ? <div className="admin-flash" style={{ marginTop: 12 }}>{status}</div> : null}
      {query.error ? <div className="admin-flash error" style={{ marginTop: 12 }}>{query.error}</div> : null}

      <div className="admin-cms-router-layout">
        <aside className="admin-card admin-cms-page-browser">
          <div className="admin-cms-page-browser-head">
            <h3>Pages</h3>
            <Link href="/admin/cms/router?page=new" className="admin-btn secondary">New Page</Link>
          </div>

          <Link href="/admin/cms/home" className="admin-cms-page-item special">
            <strong>Home Page</strong>
            <span>Template switcher + home SEO/content editor</span>
          </Link>

          <div className="admin-cms-page-list">
            {sortedPages.length === 0 ? (
              <div className="admin-cms-page-empty">No CMS pages yet. Use New Page to create your first route.</div>
            ) : (
              sortedPages.map((page) => {
                const isSelected = page.page_key === currentPage.page_key;
                const path = slugToPath(page.slug);

                return (
                  <Link
                    key={page.page_key}
                    href={`/admin/cms/router?page=${encodeURIComponent(page.page_key)}`}
                    className={`admin-cms-page-item ${isSelected ? "active" : ""}`}
                  >
                    <div className="admin-cms-page-item-top">
                      <strong>{page.title?.trim() ? page.title : toHeadline(page.page_key)}</strong>
                      <span className={`admin-pill ${page.is_active ? "ok" : "muted"}`}>{page.is_active ? "Live" : "Draft"}</span>
                    </div>
                    <code>{page.page_key}</code>
                    <span>{path}</span>
                  </Link>
                );
              })
            )}
          </div>
        </aside>

        <div className="admin-card">
          <div className="admin-cms-editor-head">
            <div>
              <h3 style={{ margin: 0 }}>{isNewPage ? "Create New Page" : (currentPage.title?.trim() ? currentPage.title : toHeadline(currentPage.page_key))}</h3>
              <p className="admin-subtitle">
                {isNewPage
                  ? "Create a page, assign template and slug, then publish."
                  : "Edit route, template, SEO, and page-level dynamic content."}
              </p>
            </div>
            {previewPath ? (
              <a href={previewPath} target="_blank" rel="noopener noreferrer" className="admin-btn secondary">Open Preview</a>
            ) : null}
          </div>

          <form action={saveCmsPageStudioAction}>
            <input type="hidden" name="redirect_to" value={redirectTarget} />
            <input type="hidden" name="seo_base_json" value={JSON.stringify(currentSeo)} />
            <input type="hidden" name="content_base_json" value={JSON.stringify(currentContent)} />

            <div className="admin-row" style={{ marginTop: 12 }}>
              <div className="admin-field" style={{ gridColumn: "span 3" }}>
                <label htmlFor="page_key">Page Key</label>
                <input id="page_key" name="page_key" defaultValue={currentPage.page_key ?? ""} placeholder="about" required />
              </div>
              <div className="admin-field" style={{ gridColumn: "span 5" }}>
                <label htmlFor="title">Page Title</label>
                <input id="title" name="title" defaultValue={currentPage.title ?? ""} placeholder="About Us" />
              </div>
              <div className="admin-field" style={{ gridColumn: "span 4" }}>
                <label htmlFor="slug">Slug (URL path)</label>
                <input id="slug" name="slug" defaultValue={currentPage.slug ?? ""} placeholder="about-us" />
              </div>

              <div className="admin-field" style={{ gridColumn: "span 12" }}>
                <label>Template Library</label>
                <div className="admin-template-library-head">
                  <div>
                    <strong>{templateChoiceState.scopeLabel}</strong>
                    <div className="admin-field-note">{templateChoiceState.scopeDescription}</div>
                  </div>
                  <span className="admin-pill ok">Page-Specific Templates</span>
                </div>
                {!templateChoiceState.currentTemplateAllowed && !isNewPage ? (
                  <div className="admin-flash error" style={{ marginBottom: 10 }}>
                    Current template does not match this page type. Select one of the templates below and save.
                  </div>
                ) : null}

                <div className="admin-template-grid admin-template-grid-compact">
                  {templateChoiceState.choices.map(([templateKey, template]) => {
                    const templatePreview = templatePreviewPath(templateKey, currentPage.slug);
                    const selected = templateKey === currentTemplateKey;

                    return (
                      <label className={`admin-template-option ${selected ? "selected" : ""}`} key={templateKey}>
                        <input type="radio" name="template_key" value={templateKey} defaultChecked={selected} />
                        <div className="admin-template-option-body">
                          <div className="admin-template-option-title">
                            <strong>{template.label ?? templateKey}</strong>
                            <span className="admin-pill">{inferTemplateCategory(templateKey)}</span>
                          </div>
                          <p>{template.description ?? "Template page"}</p>
                          <div className="admin-template-card-foot">
                            <code>{templateKey}</code>
                            {templatePreview ? <a href={templatePreview} target="_blank" rel="noopener noreferrer">Preview</a> : <span style={{ color: "var(--admin-muted)" }}>Needs slug</span>}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <small className="admin-field-note">{currentTemplate?.description ?? "Choose the visual template for this page route."}</small>
              </div>

              <div className="admin-field" style={{ gridColumn: "span 2" }}>
                <label htmlFor="nav_order">Menu Order</label>
                <input id="nav_order" name="nav_order" type="number" min={0} defaultValue={String(currentPage.nav_order ?? 0)} />
              </div>
              <div className="admin-field" style={{ gridColumn: "span 2" }}>
                <label htmlFor="is_active">Page Status</label>
                <select id="is_active" name="is_active" defaultValue={currentPage.is_active ? "1" : "0"}>
                  <option value="1">Live</option>
                  <option value="0">Draft</option>
                </select>
              </div>
              <div className="admin-field" style={{ gridColumn: "span 2" }}>
                <label htmlFor="show_in_nav">Show in Menu</label>
                <select id="show_in_nav" name="show_in_nav" defaultValue={currentPage.show_in_nav ? "1" : "0"}>
                  <option value="1">Yes</option>
                  <option value="0">No</option>
                </select>
              </div>
              <div className="admin-field" style={{ gridColumn: "span 3" }}>
                <label htmlFor="nav_label">Menu Label</label>
                <input id="nav_label" name="nav_label" defaultValue={currentPage.nav_label ?? ""} placeholder="About" />
              </div>
              <div className="admin-field" style={{ gridColumn: "span 3" }}>
                <label htmlFor="nav_group">Menu Group</label>
                <input id="nav_group" name="nav_group" defaultValue={currentPage.nav_group ?? ""} placeholder="main" />
              </div>
            </div>

            <div className="admin-card admin-cms-section-card">
              <h4>SEO Settings</h4>
              <div className="admin-row">
                <div className="admin-field" style={{ gridColumn: "span 6" }}>
                  <label htmlFor="seo_title">SEO Title</label>
                  <input id="seo_title" name="seo_title" defaultValue={toStringValue(resolvedSeo.title)} placeholder="Page title for search engines" />
                </div>
                <div className="admin-field" style={{ gridColumn: "span 6" }}>
                  <label htmlFor="seo_keywords">SEO Keywords (comma separated)</label>
                  <input id="seo_keywords" name="seo_keywords" defaultValue={toKeywordsInput(resolvedSeo.keywords)} placeholder="real estate, homes, property investment" />
                </div>
                <div className="admin-field" style={{ gridColumn: "span 12" }}>
                  <label htmlFor="seo_description">SEO Description</label>
                  <textarea id="seo_description" name="seo_description" defaultValue={toStringValue(resolvedSeo.description)} placeholder="Short description used in search result snippets." />
                </div>
                <div className="admin-field" style={{ gridColumn: "span 6" }}>
                  <label htmlFor="seo_robots_index">Robots Index</label>
                  <select id="seo_robots_index" name="seo_robots_index" defaultValue={toBooleanSelect(selectedRobots.index)}>
                    <option value="">Default</option>
                    <option value="1">Index</option>
                    <option value="0">No Index</option>
                  </select>
                </div>
                <div className="admin-field" style={{ gridColumn: "span 6" }}>
                  <label htmlFor="seo_robots_follow">Robots Follow</label>
                  <select id="seo_robots_follow" name="seo_robots_follow" defaultValue={toBooleanSelect(selectedRobots.follow)}>
                    <option value="">Default</option>
                    <option value="1">Follow</option>
                    <option value="0">No Follow</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="admin-card admin-cms-section-card">
              <h4>Visual Content Fields</h4>
              <p className="admin-subtitle">These values drive dynamic templates and detail pages without raw JSON editing.</p>
              {isListingScope ? <p className="admin-field-note" style={{ marginTop: 6 }}>Listing page and Listing details page are configured in separate sections below.</p> : null}

              <details className="admin-form-details" open>
                <summary>Hero & Intro</summary>
                <div className="admin-row">
                  {renderContentField({ inputName: "content_hero_title", contentKey: "hero_title", label: "Hero Title", span: 6 }, resolvedContent)}
                  {renderContentField({ inputName: "content_hero_subtitle", contentKey: "hero_subtitle", label: "Hero Subtitle", span: 6 }, resolvedContent)}
                  {renderContentField({ inputName: "content_intro_title", contentKey: "intro_title", label: "Intro Title", span: 6 }, resolvedContent)}
                  {renderContentField({ inputName: "content_intro_text", contentKey: "intro_text", label: "Intro Text", span: 6, multiline: true }, resolvedContent)}
                </div>
              </details>

              <details className="admin-form-details">
                <summary>Buttons & Calls to Action</summary>
                <div className="admin-row">
                  {renderContentField({ inputName: "content_primary_button_label", contentKey: "primary_button_label", label: "Primary Button Label", span: 3 }, resolvedContent)}
                  {renderContentField({ inputName: "content_primary_button_link", contentKey: "primary_button_link", label: "Primary Button Link", span: 3 }, resolvedContent)}
                  {renderContentField({ inputName: "content_secondary_button_label", contentKey: "secondary_button_label", label: "Secondary Button Label", span: 3 }, resolvedContent)}
                  {renderContentField({ inputName: "content_secondary_button_link", contentKey: "secondary_button_link", label: "Secondary Button Link", span: 3 }, resolvedContent)}
                </div>
              </details>

              {isCollectionScope ? (
                <details className="admin-form-details">
                  <summary>Collection / Empty State</summary>
                  <div className="admin-row">
                    {renderContentField({ inputName: "content_empty_message", contentKey: "empty_message", label: "Empty State Message", span: isListingScope ? 8 : 12 }, resolvedContent)}
                    {isListingScope ? (
                      <>
                        {renderContentField({ inputName: "content_per_page", contentKey: "per_page", label: "Items Per Page", span: 2, numeric: true, min: 1, max: 100, fallback: "12" }, resolvedContent)}
                        <div className="admin-field" style={{ gridColumn: "span 2" }}>
                          <label htmlFor="content_featured_only">Featured Only</label>
                          <select id="content_featured_only" name="content_featured_only" defaultValue={toBooleanSelect(resolvedContent.featured_only)}>
                            <option value="">Default</option>
                            <option value="1">Yes</option>
                            <option value="0">No</option>
                          </select>
                        </div>
                      </>
                    ) : null}
                  </div>
                </details>
              ) : null}

              {isListingScope ? (
                <details className="admin-form-details" open>
                  <summary>Listings Page Content</summary>
                  <div className="admin-row">
                    <div className="admin-field" style={{ gridColumn: "span 3" }}>
                      <label htmlFor="content_listing_layout">Layout</label>
                      <select id="content_listing_layout" name="content_listing_layout" defaultValue={toStringValue(resolvedContent.listing_layout, "grid")}>
                        <option value="grid">Grid</option>
                        <option value="list">List</option>
                      </select>
                    </div>
                    <div className="admin-field" style={{ gridColumn: "span 3" }}>
                      <label htmlFor="content_sort">Default Sort</label>
                      <select id="content_sort" name="content_sort" defaultValue={toStringValue(resolvedContent.sort, "newest")}>
                        <option value="newest">Newest</option>
                        <option value="price_asc">Price Low</option>
                        <option value="price_desc">Price High</option>
                      </select>
                    </div>
                    {LISTING_TEXT_FIELDS.map((field) => renderContentField(field, resolvedContent))}
                  </div>
                </details>
              ) : null}

              {isListingScope ? (
                <details className="admin-form-details" open>
                  <summary>Listing Details Page Content</summary>
                  <div className="admin-row">
                    <div className="admin-field" style={{ gridColumn: "span 4" }}>
                      <label htmlFor="content_details_template_key">Details Template</label>
                      <select id="content_details_template_key" name="content_details_template_key" defaultValue={toStringValue(resolvedContent.details_template_key)}>
                        <option value="">Auto</option>
                        <option value="listing_details_01">Listing Details 01</option>
                        <option value="listing_details_02">Listing Details 02</option>
                        <option value="listing_details_03">Listing Details 03</option>
                        <option value="listing_details_04">Listing Details 04</option>
                        <option value="listing_details_05">Listing Details 05</option>
                        <option value="listing_details_06">Listing Details 06</option>
                      </select>
                    </div>
                    <div className="admin-field" style={{ gridColumn: "span 4" }}>
                      <label htmlFor="content_details_video_enabled">Show Video Banner</label>
                      <select id="content_details_video_enabled" name="content_details_video_enabled" defaultValue={toBooleanSelect(resolvedContent.details_video_enabled)}>
                        <option value="">Default</option>
                        <option value="1">Enabled</option>
                        <option value="0">Disabled</option>
                      </select>
                    </div>
                    {renderContentField({ inputName: "content_details_video_url", contentKey: "details_video_url", label: "Video URL", span: 4 }, resolvedContent)}
                    {DETAIL_TEXT_FIELDS.map((field) => renderContentField(field, resolvedContent))}
                    {renderContentField({ inputName: "content_mortgage_down_payment_percent", contentKey: "mortgage_down_payment_percent", label: "Down Payment %", span: 4, numeric: true, min: 0, max: 95, step: 0.1 }, resolvedContent)}
                    {renderContentField({ inputName: "content_mortgage_interest_rate", contentKey: "mortgage_interest_rate", label: "Interest Rate %", span: 4, numeric: true, min: 0, max: 100, step: 0.01 }, resolvedContent)}
                    {renderContentField({ inputName: "content_mortgage_loan_years", contentKey: "mortgage_loan_years", label: "Loan Years", span: 4, numeric: true, min: 1, max: 50 }, resolvedContent)}
                  </div>
                </details>
              ) : null}

              {isListingScope ? (
                <details className="admin-form-details">
                  <summary>Agent Contact Fallback</summary>
                  <div className="admin-row">
                    {AGENT_FIELDS.map((field) => renderContentField(field, resolvedContent))}
                  </div>
                </details>
              ) : null}
            </div>

            <div className="admin-actions" style={{ marginTop: 12 }}>
              <button className="admin-btn" type="submit">Save Page</button>
              {!isNewPage && currentPage.page_key ? (
                <Link href={`/admin/cms/router?page=${encodeURIComponent(currentPage.page_key)}`} className="admin-btn secondary">Reset Changes</Link>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

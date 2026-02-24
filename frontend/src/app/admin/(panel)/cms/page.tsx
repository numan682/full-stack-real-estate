import {
  saveCmsPagesAction,
  savePageSectionsAction,
  saveGlobalSettingsAction,
  saveHomeSectionsAction,
  saveHomeTemplateAction,
} from "@/app/admin/(panel)/cms/actions";
import { fetchAdminCms } from "@/lib/admin/backend-client";
import type { AdminCmsData } from "@/lib/admin/types";

type CmsPageProps = {
  searchParams: Promise<{
    status?: string;
    error?: string;
  }>;
};

function statusMessage(status?: string) {
  if (status === "home-template-saved") {
    return "Active home template updated.";
  }

  if (status === "home-sections-saved") {
    return "Home sections updated.";
  }

  if (status === "cms-pages-saved") {
    return "CMS pages and dynamic routes updated.";
  }

  if (status === "page-sections-saved") {
    return "Dynamic page sections updated.";
  }

  if (status === "global-settings-saved") {
    return "Global settings updated.";
  }

  return null;
}

function buildCmsPageRows(cmsPages: AdminCmsData["cms_pages"]) {
  const defaultRows = [...cmsPages];

  for (let index = 0; index < 3; index += 1) {
    defaultRows.push({
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

  return defaultRows;
}

function buildSectionRows(sections: Array<{
  sectionKey: string;
  name?: string | null;
  sortOrder: number;
  isEnabled: boolean;
  payload?: Record<string, unknown>;
}> | undefined) {
  const rows = [...(sections ?? [])];

  for (let index = 0; index < 2; index += 1) {
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

export default async function AdminCmsPage({ searchParams }: CmsPageProps) {
  const query = await searchParams;
  const response = await fetchAdminCms();

  if (!response.ok || !response.data) {
    return (
      <section>
        <h2 className="admin-title">CMS Control</h2>
        <div className="admin-flash error">{response.message ?? "Failed to load CMS data."}</div>
      </section>
    );
  }

  const status = statusMessage(query.status);
  const {
    home_templates: homeTemplates,
    template_options: templateOptions,
    section_templates: sectionTemplates,
    active_home_template: activeTemplate,
    home_sections: sections,
    page_sections: pageSections,
    cms_pages: cmsPages,
    global_settings: settings,
  } = response.data;
  const cmsPageRows = buildCmsPageRows(cmsPages);
  const dynamicPages = cmsPages.filter((page) => page.template_key === "cms_dynamic");

  return (
    <section>
      <h2 className="admin-title">CMS Control</h2>
      <p className="admin-subtitle">Manage dynamic routes, page templates, slugs, navigation, and global branding content.</p>

      {status ? <div className="admin-flash" style={{ marginTop: 12 }}>{status}</div> : null}
      {query.error ? <div className="admin-flash error" style={{ marginTop: 12 }}>{query.error}</div> : null}

      <div className="admin-card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Home Template Selector</h3>
        <form action={saveHomeTemplateAction}>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Active</th>
                  <th>Template</th>
                  <th>Description</th>
                  <th>Key</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(homeTemplates).map(([templateKey, template]) => (
                  <tr key={templateKey}>
                    <td>
                      <input
                        type="radio"
                        name="home_template"
                        value={templateKey}
                        defaultChecked={activeTemplate === templateKey}
                      />
                    </td>
                    <td>{template.label ?? templateKey}</td>
                    <td>{template.description ?? "-"}</td>
                    <td><code>{templateKey}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-actions" style={{ marginTop: 10 }}>
            <button className="admin-btn" type="submit">Save Active Template</button>
          </div>
        </form>
      </div>

      <div className="admin-card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Dynamic Page Router</h3>
        <p className="admin-subtitle">Map logical page keys to template files, slugs, nav labels, and SEO/content payload JSON.</p>
        <p className="admin-subtitle" style={{ marginTop: 6 }}>
          Content JSON accepts CSS selectors as keys. Example: <code>{`{ ".inner-banner h3": "About Our Company" }`}</code>
        </p>
        <datalist id="template-keys">
          {Object.entries(templateOptions).map(([templateKey, template]) => (
            <option key={templateKey} value={templateKey}>
              {template.label ?? templateKey}
            </option>
          ))}
        </datalist>
        <form action={saveCmsPagesAction}>
          <div className="admin-table-wrap" style={{ marginTop: 10 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Page Key</th>
                  <th>Template Key</th>
                  <th>Slug</th>
                  <th>Title</th>
                  <th>Nav Label</th>
                  <th>Nav Group</th>
                  <th>Order</th>
                  <th>In Nav</th>
                  <th>Active</th>
                  <th>SEO JSON</th>
                  <th>Content JSON</th>
                </tr>
              </thead>
              <tbody>
                {cmsPageRows.map((page, index) => (
                  <tr key={`${page.page_key || "new"}-${index}`}>
                    <td>
                      <input
                        name={`pages[${index}][page_key]`}
                        defaultValue={page.page_key ?? ""}
                        placeholder="about"
                      />
                    </td>
                    <td>
                      <input
                        name={`pages[${index}][template_key]`}
                        defaultValue={page.template_key ?? ""}
                        list="template-keys"
                        placeholder="about_us_01"
                      />
                    </td>
                    <td>
                      <input
                        name={`pages[${index}][slug]`}
                        defaultValue={page.slug ?? ""}
                        placeholder="about-us"
                      />
                    </td>
                    <td>
                      <input
                        name={`pages[${index}][title]`}
                        defaultValue={page.title ?? ""}
                      />
                    </td>
                    <td>
                      <input
                        name={`pages[${index}][nav_label]`}
                        defaultValue={page.nav_label ?? ""}
                      />
                    </td>
                    <td>
                      <input
                        name={`pages[${index}][nav_group]`}
                        defaultValue={page.nav_group ?? ""}
                        placeholder="main"
                      />
                    </td>
                    <td>
                      <input
                        name={`pages[${index}][nav_order]`}
                        defaultValue={String(page.nav_order ?? 0)}
                        type="number"
                        min={0}
                      />
                    </td>
                    <td>
                      <select
                        name={`pages[${index}][show_in_nav]`}
                        defaultValue={page.show_in_nav ? "1" : "0"}
                      >
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                      </select>
                    </td>
                    <td>
                      <select
                        name={`pages[${index}][is_active]`}
                        defaultValue={page.is_active ? "1" : "0"}
                      >
                        <option value="1">Active</option>
                        <option value="0">Disabled</option>
                      </select>
                    </td>
                    <td>
                      <textarea
                        name={`pages[${index}][seo]`}
                        defaultValue={JSON.stringify(page.seo ?? {}, null, 2)}
                      />
                    </td>
                    <td>
                      <textarea
                        name={`pages[${index}][content]`}
                        defaultValue={JSON.stringify(page.content ?? {}, null, 2)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-actions" style={{ marginTop: 10 }}>
            <button className="admin-btn" type="submit">Save Dynamic Routes</button>
          </div>
        </form>
      </div>

      <div className="admin-card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Home 01 Section Builder</h3>
        <p className="admin-subtitle">Enable/disable, re-order, rename, and override per-section payload JSON.</p>
        <form action={saveHomeSectionsAction}>
          <div className="admin-table-wrap" style={{ marginTop: 10 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Section Key</th>
                  <th>Name</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Payload JSON</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section, index) => (
                  <tr key={`${section.section_key}-${index}`}>
                    <td>
                      <input type="hidden" name={`sections[${index}][section_key]`} defaultValue={section.section_key} />
                      <code>{section.section_key}</code>
                    </td>
                    <td>
                      <input
                        name={`sections[${index}][name]`}
                        defaultValue={section.name ?? ""}
                        type="text"
                      />
                    </td>
                    <td>
                      <input
                        name={`sections[${index}][sort_order]`}
                        defaultValue={String(section.sort_order ?? 0)}
                        type="number"
                        min={0}
                      />
                    </td>
                    <td>
                      <select
                        name={`sections[${index}][is_enabled]`}
                        defaultValue={section.is_enabled ? "1" : "0"}
                      >
                        <option value="1">Enabled</option>
                        <option value="0">Disabled</option>
                      </select>
                    </td>
                    <td>
                      <textarea
                        name={`sections[${index}][payload]`}
                        defaultValue={JSON.stringify(section.payload ?? {}, null, 2)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-actions" style={{ marginTop: 10 }}>
            <button className="admin-btn" type="submit">Save Home Sections</button>
          </div>
        </form>
      </div>

      <div className="admin-card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>CMS Dynamic Page Builder</h3>
        <p className="admin-subtitle">Manage reusable sections for pages using template key <code>cms_dynamic</code>.</p>
        <p className="admin-subtitle" style={{ marginTop: 6 }}>
          Available section keys: {Object.entries(sectionTemplates).map(([key, template]) => `${key} (${template.label ?? key})`).join(", ")}
        </p>

        {dynamicPages.length === 0 ? (
          <div className="admin-flash" style={{ marginTop: 10 }}>
            Create a page with template key <code>cms_dynamic</code> in the Dynamic Page Router section to use this builder.
          </div>
        ) : (
          <form action={savePageSectionsAction}>
            {dynamicPages.map((page) => {
              const rows = buildSectionRows(pageSections[page.page_key]);

              return (
                <div key={page.page_key} style={{ marginTop: 16 }}>
                  <h4 style={{ marginBottom: 8 }}>
                    {page.title ?? page.page_key} <code style={{ marginLeft: 8 }}>{page.page_key}</code>
                  </h4>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Section Key</th>
                          <th>Name</th>
                          <th>Order</th>
                          <th>Status</th>
                          <th>Payload JSON</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((section, index) => (
                          <tr key={`${page.page_key}-${section.sectionKey || "new"}-${index}`}>
                            <td>
                              <input
                                name={`page_sections[${page.page_key}][${index}][section_key]`}
                                defaultValue={section.sectionKey ?? ""}
                                list="section-keys"
                                placeholder="hero_banner"
                              />
                            </td>
                            <td>
                              <input
                                name={`page_sections[${page.page_key}][${index}][name]`}
                                defaultValue={section.name ?? ""}
                              />
                            </td>
                            <td>
                              <input
                                name={`page_sections[${page.page_key}][${index}][sort_order]`}
                                defaultValue={String(section.sortOrder ?? 0)}
                                type="number"
                                min={0}
                              />
                            </td>
                            <td>
                              <select
                                name={`page_sections[${page.page_key}][${index}][is_enabled]`}
                                defaultValue={section.isEnabled ? "1" : "0"}
                              >
                                <option value="1">Enabled</option>
                                <option value="0">Disabled</option>
                              </select>
                            </td>
                            <td>
                              <textarea
                                name={`page_sections[${page.page_key}][${index}][payload]`}
                                defaultValue={JSON.stringify(section.payload ?? {}, null, 2)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            <datalist id="section-keys">
              {Object.entries(sectionTemplates).map(([sectionKey, sectionTemplate]) => (
                <option key={sectionKey} value={sectionKey}>
                  {sectionTemplate.label ?? sectionKey}
                </option>
              ))}
            </datalist>

            <div className="admin-actions" style={{ marginTop: 12 }}>
              <button className="admin-btn" type="submit">Save Dynamic Sections</button>
            </div>
          </form>
        )}
      </div>

      <div className="admin-card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Global Branding, Header and Footer</h3>
        <form action={saveGlobalSettingsAction}>
          <div className="admin-row">
            <div className="admin-field" style={{ gridColumn: "span 4" }}>
              <label htmlFor="branding_site_name">Site Name</label>
              <input
                id="branding_site_name"
                name="branding_site_name"
                defaultValue={settings.branding?.site_name ?? ""}
              />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 5" }}>
              <label htmlFor="branding_logo_path">Logo Path</label>
              <input
                id="branding_logo_path"
                name="branding_logo_path"
                defaultValue={settings.branding?.logo_path ?? ""}
                placeholder="/images/logo/logo.svg"
              />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="branding_logo_alt">Logo Alt</label>
              <input
                id="branding_logo_alt"
                name="branding_logo_alt"
                defaultValue={settings.branding?.logo_alt ?? ""}
              />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 6" }}>
              <label htmlFor="header_announcement_text">Header Announcement Text</label>
              <input
                id="header_announcement_text"
                name="header_announcement_text"
                defaultValue={settings.header?.announcement_text ?? ""}
              />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 6" }}>
              <label htmlFor="header_announcement_link">Header Announcement Link</label>
              <input
                id="header_announcement_link"
                name="header_announcement_link"
                defaultValue={settings.header?.announcement_link ?? ""}
              />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="header_home_nav_label">Home Nav Label</label>
              <input
                id="header_home_nav_label"
                name="header_home_nav_label"
                defaultValue={settings.header?.home_nav_label ?? ""}
              />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="header_login_label">Header Login Label</label>
              <input
                id="header_login_label"
                name="header_login_label"
                defaultValue={settings.header?.login_label ?? ""}
              />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="header_add_listing_label">Header Add Listing Label</label>
              <input
                id="header_add_listing_label"
                name="header_add_listing_label"
                defaultValue={settings.header?.add_listing_label ?? ""}
              />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 6" }}>
              <label htmlFor="header_add_listing_link">Header Add Listing Link</label>
              <input
                id="header_add_listing_link"
                name="header_add_listing_link"
                defaultValue={settings.header?.add_listing_link ?? ""}
              />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 6" }}>
              <label htmlFor="footer_address">Footer Address</label>
              <input
                id="footer_address"
                name="footer_address"
                defaultValue={settings.footer?.address ?? ""}
              />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="footer_email">Footer Email</label>
              <input
                id="footer_email"
                name="footer_email"
                defaultValue={settings.footer?.email ?? ""}
                type="email"
              />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="footer_copyright_text">Copyright Text</label>
              <input
                id="footer_copyright_text"
                name="footer_copyright_text"
                defaultValue={settings.footer?.copyright_text ?? ""}
              />
            </div>
          </div>

          <div className="admin-actions" style={{ marginTop: 10 }}>
            <button className="admin-btn" type="submit">Save Global Settings</button>
          </div>
        </form>
      </div>
    </section>
  );
}

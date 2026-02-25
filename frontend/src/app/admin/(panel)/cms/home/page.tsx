import {
  saveHomeContentAction,
  saveHomeSectionsAction,
  saveHomeTemplateAction,
} from "@/app/admin/(panel)/cms/actions";
import { CmsSettingsNav } from "@/app/admin/(panel)/cms/cms-settings-nav";
import { cmsStatusMessage, templatePreviewPath } from "@/app/admin/(panel)/cms/shared";
import { fetchAdminCms } from "@/lib/admin/backend-client";

type CmsHomePageProps = {
  searchParams: Promise<{
    status?: string;
    error?: string;
  }>;
};

export default async function AdminCmsHomePage({ searchParams }: CmsHomePageProps) {
  const query = await searchParams;
  const response = await fetchAdminCms();

  if (!response.ok || !response.data) {
    return (
      <section>
        <h2 className="admin-title">CMS Home Settings</h2>
        <div className="admin-flash error">{response.message ?? "Failed to load CMS data."}</div>
      </section>
    );
  }

  const status = cmsStatusMessage(query.status);
  const {
    home_templates: homeTemplates,
    active_home_template: activeTemplate,
    home_sections: sections,
    cms_pages: cmsPages,
  } = response.data;
  const homePage = cmsPages.find((page) => page.page_key === "home");
  const homeSeo = homePage?.seo && typeof homePage.seo === "object" ? homePage.seo : {};
  const homeContent = homePage?.content && typeof homePage.content === "object" ? homePage.content : {};
  const homeKeywords = Array.isArray((homeSeo as Record<string, unknown>).keywords)
    ? ((homeSeo as Record<string, unknown>).keywords as unknown[])
      .filter((item): item is string => typeof item === "string" && item.trim() !== "")
      .join(", ")
    : "";
  const homeRobots = (homeSeo as Record<string, unknown>).robots && typeof (homeSeo as Record<string, unknown>).robots === "object"
    ? (homeSeo as Record<string, unknown>).robots as Record<string, unknown>
    : {};

  return (
    <section>
      <h2 className="admin-title">CMS Home Settings</h2>
      <p className="admin-subtitle">Choose how your home page looks and control each modular section.</p>

      <CmsSettingsNav active="home" />

      {status ? <div className="admin-flash" style={{ marginTop: 12 }}>{status}</div> : null}
      {query.error ? <div className="admin-flash error" style={{ marginTop: 12 }}>{query.error}</div> : null}

      <div className="admin-card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Home Template Selector</h3>
        <p className="admin-subtitle">Select a home template visually and publish it instantly.</p>
        <form action={saveHomeTemplateAction}>
          <input type="hidden" name="redirect_to" value="/admin/cms/home" />
          <div className="admin-template-grid" style={{ marginTop: 12 }}>
            {Object.entries(homeTemplates).map(([templateKey, template]) => {
              const previewPath = templatePreviewPath(templateKey);

              return (
                <label className={`admin-template-option ${activeTemplate === templateKey ? "selected" : ""}`} key={templateKey}>
                  <input
                    type="radio"
                    name="home_template"
                    value={templateKey}
                    defaultChecked={activeTemplate === templateKey}
                  />
                  <div className="admin-template-option-body">
                    <div className="admin-template-option-title">
                      <strong>{template.label ?? templateKey}</strong>
                      <code>{templateKey}</code>
                    </div>
                    <p>{template.description ?? "Home template"}</p>
                    {previewPath ? (
                      <a href={previewPath} target="_blank" rel="noopener noreferrer">Preview</a>
                    ) : null}
                  </div>
                </label>
              );
            })}
          </div>
          <div className="admin-actions" style={{ marginTop: 12 }}>
            <button className="admin-btn" type="submit">Save Active Home Template</button>
          </div>
        </form>
      </div>

      <div className="admin-card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Home SEO & Visual Content</h3>
        <p className="admin-subtitle">Manage homepage metadata and key dynamic content fields without JSON.</p>
        <form action={saveHomeContentAction}>
          <input type="hidden" name="redirect_to" value="/admin/cms/home" />
          <input type="hidden" name="home_template_key" value={activeTemplate} />
          <input type="hidden" name="seo_base_json" value={JSON.stringify(homeSeo)} />
          <input type="hidden" name="content_base_json" value={JSON.stringify(homeContent)} />

          <div className="admin-row" style={{ marginTop: 10 }}>
            <div className="admin-field" style={{ gridColumn: "span 4" }}>
              <label htmlFor="title">Home Page Title</label>
              <input id="title" name="title" defaultValue={homePage?.title ?? "Home"} />
            </div>
            <div className="admin-field" style={{ gridColumn: "span 4" }}>
              <label htmlFor="seo_title">SEO Title</label>
              <input id="seo_title" name="seo_title" defaultValue={typeof (homeSeo as Record<string, unknown>).title === "string" ? (homeSeo as Record<string, unknown>).title as string : ""} />
            </div>
            <div className="admin-field" style={{ gridColumn: "span 4" }}>
              <label htmlFor="seo_keywords">SEO Keywords (comma separated)</label>
              <input id="seo_keywords" name="seo_keywords" defaultValue={homeKeywords} />
            </div>
            <div className="admin-field" style={{ gridColumn: "span 12" }}>
              <label htmlFor="seo_description">SEO Description</label>
              <textarea id="seo_description" name="seo_description" defaultValue={typeof (homeSeo as Record<string, unknown>).description === "string" ? (homeSeo as Record<string, unknown>).description as string : ""} />
            </div>
            <div className="admin-field" style={{ gridColumn: "span 6" }}>
              <label htmlFor="seo_robots_index">Robots Index</label>
              <select
                id="seo_robots_index"
                name="seo_robots_index"
                defaultValue={typeof homeRobots.index === "boolean" ? (homeRobots.index ? "1" : "0") : ""}
              >
                <option value="">Default</option>
                <option value="1">Index</option>
                <option value="0">No Index</option>
              </select>
            </div>
            <div className="admin-field" style={{ gridColumn: "span 6" }}>
              <label htmlFor="seo_robots_follow">Robots Follow</label>
              <select
                id="seo_robots_follow"
                name="seo_robots_follow"
                defaultValue={typeof homeRobots.follow === "boolean" ? (homeRobots.follow ? "1" : "0") : ""}
              >
                <option value="">Default</option>
                <option value="1">Follow</option>
                <option value="0">No Follow</option>
              </select>
            </div>

            <div className="admin-field" style={{ gridColumn: "span 6" }}>
              <label htmlFor="content_hero_title">Hero Title</label>
              <input
                id="content_hero_title"
                name="content_hero_title"
                defaultValue={typeof (homeContent as Record<string, unknown>).hero_title === "string" ? (homeContent as Record<string, unknown>).hero_title as string : ""}
              />
            </div>
            <div className="admin-field" style={{ gridColumn: "span 6" }}>
              <label htmlFor="content_hero_subtitle">Hero Subtitle</label>
              <input
                id="content_hero_subtitle"
                name="content_hero_subtitle"
                defaultValue={typeof (homeContent as Record<string, unknown>).hero_subtitle === "string" ? (homeContent as Record<string, unknown>).hero_subtitle as string : ""}
              />
            </div>
            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="content_primary_button_label">Primary Button Label</label>
              <input
                id="content_primary_button_label"
                name="content_primary_button_label"
                defaultValue={typeof (homeContent as Record<string, unknown>).primary_button_label === "string" ? (homeContent as Record<string, unknown>).primary_button_label as string : ""}
              />
            </div>
            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="content_primary_button_link">Primary Button Link</label>
              <input
                id="content_primary_button_link"
                name="content_primary_button_link"
                defaultValue={typeof (homeContent as Record<string, unknown>).primary_button_link === "string" ? (homeContent as Record<string, unknown>).primary_button_link as string : ""}
              />
            </div>
            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="content_secondary_button_label">Secondary Button Label</label>
              <input
                id="content_secondary_button_label"
                name="content_secondary_button_label"
                defaultValue={typeof (homeContent as Record<string, unknown>).secondary_button_label === "string" ? (homeContent as Record<string, unknown>).secondary_button_label as string : ""}
              />
            </div>
            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="content_secondary_button_link">Secondary Button Link</label>
              <input
                id="content_secondary_button_link"
                name="content_secondary_button_link"
                defaultValue={typeof (homeContent as Record<string, unknown>).secondary_button_link === "string" ? (homeContent as Record<string, unknown>).secondary_button_link as string : ""}
              />
            </div>
            <div className="admin-field" style={{ gridColumn: "span 6" }}>
              <label htmlFor="content_intro_title">Intro Title</label>
              <input
                id="content_intro_title"
                name="content_intro_title"
                defaultValue={typeof (homeContent as Record<string, unknown>).intro_title === "string" ? (homeContent as Record<string, unknown>).intro_title as string : ""}
              />
            </div>
            <div className="admin-field" style={{ gridColumn: "span 6" }}>
              <label htmlFor="content_intro_text">Intro Text</label>
              <textarea
                id="content_intro_text"
                name="content_intro_text"
                defaultValue={typeof (homeContent as Record<string, unknown>).intro_text === "string" ? (homeContent as Record<string, unknown>).intro_text as string : ""}
              />
            </div>
          </div>

          <div className="admin-actions" style={{ marginTop: 10 }}>
            <button className="admin-btn" type="submit">Save Home SEO & Content</button>
          </div>
        </form>
      </div>

      <div className="admin-card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Home 01 Section Builder</h3>
        <p className="admin-subtitle">Re-order, enable/disable, and customize payload JSON per section.</p>
        <form action={saveHomeSectionsAction}>
          <input type="hidden" name="redirect_to" value="/admin/cms/home" />
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
    </section>
  );
}

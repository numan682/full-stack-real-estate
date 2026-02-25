import Link from "next/link";
import { fetchAdminCms } from "@/lib/admin/backend-client";
import { CmsSettingsNav } from "@/app/admin/(panel)/cms/cms-settings-nav";
import { cmsStatusMessage, inferTemplateCategory, slugToPath, templatePreviewPath } from "@/app/admin/(panel)/cms/shared";

type CmsOverviewPageProps = {
  searchParams: Promise<{
    status?: string;
    error?: string;
  }>;
};

export default async function AdminCmsOverviewPage({ searchParams }: CmsOverviewPageProps) {
  const query = await searchParams;
  const response = await fetchAdminCms();

  if (!response.ok || !response.data) {
    return (
      <section>
        <h2 className="admin-title">CMS Settings</h2>
        <div className="admin-flash error">{response.message ?? "Failed to load CMS data."}</div>
      </section>
    );
  }

  const status = cmsStatusMessage(query.status);
  const {
    template_options: templateOptions,
    home_templates: homeTemplates,
    cms_pages: cmsPages,
    page_sections: pageSections,
  } = response.data;

  const activePages = cmsPages.filter((page) => page.is_active);
  const navPages = cmsPages.filter((page) => page.is_active && page.show_in_nav);
  const dynamicPages = cmsPages.filter((page) => page.template_key === "cms_dynamic");
  const templates = Object.entries(templateOptions);
  const sectionPageCount = Object.keys(pageSections).length;

  return (
    <section>
      <h2 className="admin-title">CMS Settings</h2>
      <p className="admin-subtitle">Professional CMS workspace with separate settings pages and visual routing previews.</p>

      <CmsSettingsNav active="overview" />

      {status ? <div className="admin-flash" style={{ marginTop: 12 }}>{status}</div> : null}
      {query.error ? <div className="admin-flash error" style={{ marginTop: 12 }}>{query.error}</div> : null}

      <div className="admin-cms-overview-grid">
        <article className="admin-card admin-cms-overview-card">
          <h3>Home Setup</h3>
          <p>{`${Object.keys(homeTemplates).length} home templates, Home 01 modular sections.`}</p>
          <Link href="/admin/cms/home" className="admin-btn">Open Home Settings</Link>
        </article>
        <article className="admin-card admin-cms-overview-card">
          <h3>Page Studio</h3>
          <p>{`${cmsPages.length} routed pages, ${activePages.length} active, ${navPages.length} in navigation.`}</p>
          <Link href="/admin/cms/router" className="admin-btn">Open Page Studio</Link>
        </article>
        <article className="admin-card admin-cms-overview-card">
          <h3>Dynamic Sections</h3>
          <p>{`${dynamicPages.length} cms_dynamic pages, ${sectionPageCount} section maps configured.`}</p>
          <Link href="/admin/cms/sections" className="admin-btn">Open Sections</Link>
        </article>
        <article className="admin-card admin-cms-overview-card">
          <h3>Global UI</h3>
          <p>Branding, header labels, and footer settings for the entire website.</p>
          <Link href="/admin/cms/global" className="admin-btn">Open Global Settings</Link>
        </article>
      </div>

      <div className="admin-card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Page Directory</h3>
        <p className="admin-subtitle">Every CMS page with template type, route, and preview.</p>
        <div className="admin-table-wrap" style={{ marginTop: 10 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Template</th>
                <th>Type</th>
                <th>Route</th>
                <th>Visibility</th>
                <th>Preview</th>
              </tr>
            </thead>
            <tbody>
              {cmsPages.length === 0 ? (
                <tr>
                  <td colSpan={6}>No pages configured yet.</td>
                </tr>
              ) : (
                cmsPages.map((page) => {
                  const previewPath = templatePreviewPath(page.template_key, page.slug);

                  return (
                    <tr key={page.page_key}>
                      <td>
                        <strong>{page.title ?? page.page_key}</strong>
                        <div style={{ color: "var(--admin-muted)", fontSize: 12 }}>
                          <code>{page.page_key}</code>
                        </div>
                      </td>
                      <td>
                        <div>{templateOptions[page.template_key]?.label ?? page.template_key}</div>
                        <div style={{ color: "var(--admin-muted)", fontSize: 12 }}>
                          <code>{page.template_key}</code>
                        </div>
                      </td>
                      <td>
                        <span className="admin-pill">{inferTemplateCategory(page.template_key)}</span>
                      </td>
                      <td><code>{slugToPath(page.slug)}</code></td>
                      <td>
                        <span className={`admin-pill ${page.is_active ? "ok" : "muted"}`}>
                          {page.is_active ? "Active" : "Disabled"}
                        </span>{" "}
                        <span className={`admin-pill ${page.show_in_nav ? "ok" : "muted"}`}>
                          {page.show_in_nav ? "In Nav" : "Hidden"}
                        </span>
                      </td>
                      <td>
                        {previewPath ? (
                          <a href={previewPath} target="_blank" rel="noopener noreferrer">Open</a>
                        ) : (
                          <span style={{ color: "var(--admin-muted)" }}>Set slug</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Template Snapshot</h3>
        <p className="admin-subtitle">Visual catalog to quickly understand what each template is for.</p>
        <div className="admin-template-grid">
          {templates.slice(0, 16).map(([templateKey, template]) => {
            const previewPath = templatePreviewPath(templateKey);

            return (
              <article className="admin-template-card" key={templateKey}>
                <div className="admin-template-card-head">
                  <strong>{template.label ?? templateKey}</strong>
                  <span className="admin-pill">{inferTemplateCategory(templateKey)}</span>
                </div>
                <p>{template.description ?? "Template page"}</p>
                <div className="admin-template-card-foot">
                  <code>{templateKey}</code>
                  {previewPath ? (
                    <a href={previewPath} target="_blank" rel="noopener noreferrer">Preview</a>
                  ) : (
                    <span style={{ color: "var(--admin-muted)" }}>Mapped via router</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

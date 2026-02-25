import { savePageSectionsAction } from "@/app/admin/(panel)/cms/actions";
import { CmsSettingsNav } from "@/app/admin/(panel)/cms/cms-settings-nav";
import { buildSectionRows, cmsStatusMessage } from "@/app/admin/(panel)/cms/shared";
import { fetchAdminCms } from "@/lib/admin/backend-client";

type CmsSectionsPageProps = {
  searchParams: Promise<{
    status?: string;
    error?: string;
  }>;
};

export default async function AdminCmsSectionsPage({ searchParams }: CmsSectionsPageProps) {
  const query = await searchParams;
  const response = await fetchAdminCms();

  if (!response.ok || !response.data) {
    return (
      <section>
        <h2 className="admin-title">CMS Dynamic Sections</h2>
        <div className="admin-flash error">{response.message ?? "Failed to load CMS data."}</div>
      </section>
    );
  }

  const status = cmsStatusMessage(query.status);
  const {
    section_templates: sectionTemplates,
    page_sections: pageSections,
    cms_pages: cmsPages,
  } = response.data;

  const dynamicPages = cmsPages.filter((page) => page.template_key === "cms_dynamic");

  return (
    <section>
      <h2 className="admin-title">CMS Dynamic Sections</h2>
      <p className="admin-subtitle">Configure section composition for pages that use the `cms_dynamic` template.</p>

      <CmsSettingsNav active="sections" />

      {status ? <div className="admin-flash" style={{ marginTop: 12 }}>{status}</div> : null}
      {query.error ? <div className="admin-flash error" style={{ marginTop: 12 }}>{query.error}</div> : null}

      <div className="admin-card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Available Section Templates</h3>
        <p className="admin-subtitle">These are reusable section types for `cms_dynamic` pages.</p>
        <div className="admin-template-grid" style={{ marginTop: 12 }}>
          {Object.entries(sectionTemplates).map(([sectionKey, sectionTemplate]) => (
            <article className="admin-template-card" key={sectionKey}>
              <div className="admin-template-card-head">
                <strong>{sectionTemplate.label ?? sectionKey}</strong>
                <code>{sectionKey}</code>
              </div>
              <p>{sectionTemplate.description ?? "Reusable section block."}</p>
              <details>
                <summary>Payload Example</summary>
                <pre className="admin-json-preview">
                  {JSON.stringify(sectionTemplate.payload ?? {}, null, 2)}
                </pre>
              </details>
            </article>
          ))}
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Page Section Builder</h3>
        {dynamicPages.length === 0 ? (
          <div className="admin-flash" style={{ marginTop: 10 }}>
            No page currently uses template key <code>cms_dynamic</code>. Create one in Page Router first.
          </div>
        ) : (
          <form action={savePageSectionsAction}>
            <input type="hidden" name="redirect_to" value="/admin/cms/sections" />
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
    </section>
  );
}

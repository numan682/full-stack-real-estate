import { saveGlobalSettingsAction } from "@/app/admin/(panel)/cms/actions";
import { CmsSettingsNav } from "@/app/admin/(panel)/cms/cms-settings-nav";
import { cmsStatusMessage } from "@/app/admin/(panel)/cms/shared";
import { fetchAdminCms } from "@/lib/admin/backend-client";

type CmsGlobalPageProps = {
  searchParams: Promise<{
    status?: string;
    error?: string;
  }>;
};

export default async function AdminCmsGlobalPage({ searchParams }: CmsGlobalPageProps) {
  const query = await searchParams;
  const response = await fetchAdminCms();

  if (!response.ok || !response.data) {
    return (
      <section>
        <h2 className="admin-title">CMS Global Settings</h2>
        <div className="admin-flash error">{response.message ?? "Failed to load CMS data."}</div>
      </section>
    );
  }

  const status = cmsStatusMessage(query.status);
  const { global_settings: settings } = response.data;

  return (
    <section>
      <h2 className="admin-title">CMS Global Settings</h2>
      <p className="admin-subtitle">Manage website-wide branding, header actions, and footer content.</p>

      <CmsSettingsNav active="global" />

      {status ? <div className="admin-flash" style={{ marginTop: 12 }}>{status}</div> : null}
      {query.error ? <div className="admin-flash error" style={{ marginTop: 12 }}>{query.error}</div> : null}

      <div className="admin-card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Branding, Header, and Footer</h3>
        <form action={saveGlobalSettingsAction}>
          <input type="hidden" name="redirect_to" value="/admin/cms/global" />
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

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
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

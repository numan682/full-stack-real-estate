import Link from "next/link";
import { fetchCmsConfig } from "@/lib/cms-api";
import { requirePortalUser } from "@/lib/portal/auth";
import { PortalShell } from "@/app/(site)/portal/portal-shell";

export default async function CustomerPortalPage() {
  const [cmsConfig, user] = await Promise.all([
    fetchCmsConfig(),
    requirePortalUser(["customer"]),
  ]);

  return (
    <PortalShell
      cmsConfig={cmsConfig}
      title="Customer Dashboard"
      subtitle="Basic customer tools and quick actions."
      user={user}
    >
      <div className="admin-grid-cards" style={{ marginTop: 16 }}>
        <div className="admin-stat">
          <p className="label">Account Role</p>
          <p className="value" style={{ fontSize: 20 }}>Customer</p>
        </div>
        <div className="admin-stat">
          <p className="label">Portal Access</p>
          <p className="value" style={{ fontSize: 20 }}>Active</p>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Quick Actions</h3>
        <p style={{ marginTop: 8 }}>
          Browse properties, submit inquiry forms, and contact our sales team directly.
        </p>
        <div className="admin-actions" style={{ marginTop: 14 }}>
          <Link href="/properties" className="admin-btn">Browse Listings</Link>
          <Link href="/contact" className="admin-btn secondary">Contact Team</Link>
          <Link href="/blog" className="admin-btn secondary">Read Updates</Link>
        </div>
      </div>
    </PortalShell>
  );
}

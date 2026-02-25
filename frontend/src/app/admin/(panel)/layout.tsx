import type { ReactNode } from "react";
import Link from "next/link";
import { logoutAdminAction } from "@/app/admin/actions";
import { requireAdminUser } from "@/lib/admin/auth";
import { AdminNav } from "@/app/admin/(panel)/admin-nav";

type AdminPanelLayoutProps = {
  children: ReactNode;
};

export default async function AdminPanelLayout({ children }: AdminPanelLayoutProps) {
  const adminUser = await requireAdminUser();

  return (
    <div className="admin-page">
      <div className="admin-grid">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <span className="admin-sidebar-kicker">Admin Dashboard</span>
            <h1>RealEstate</h1>
          </div>

          <div className="admin-sidebar-section">
            <div className="admin-sidebar-section-title">Navigation</div>
            <AdminNav />
          </div>

          <div className="admin-sidebar-profile">
            <div className="admin-sidebar-section-title">Signed In</div>
            <div className="admin-sidebar-profile-name">{adminUser.name}</div>
            <div className="admin-sidebar-profile-email">{adminUser.email}</div>
          </div>

          <div className="admin-sidebar-actions">
            <form action={logoutAdminAction}>
              <button className="admin-btn secondary" type="submit">Logout</button>
            </form>

            <Link href="/" className="admin-btn" target="_blank" rel="noopener noreferrer">
              Open Website
            </Link>
          </div>
        </aside>

        <main className="admin-main">
          <header className="admin-topbar">
            <div>
              <div className="admin-topbar-label">Workspace</div>
              <h2>Operations Dashboard</h2>
            </div>
            <div className="admin-topbar-meta">
              <strong>{adminUser.name}</strong>
              <span>{adminUser.email}</span>
            </div>
          </header>

          <div className="admin-main-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

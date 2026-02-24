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
          <h1>RealEstate Admin</h1>
          <AdminNav />

          <div style={{ marginTop: 28 }}>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>Signed in as</div>
            <div style={{ fontSize: 13, color: "#fff" }}>{adminUser.name}</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{adminUser.email}</div>
          </div>

          <form action={logoutAdminAction} style={{ marginTop: 18 }}>
            <button className="admin-btn secondary" type="submit">Logout</button>
          </form>

          <div style={{ marginTop: 20 }}>
            <Link href="/" className="admin-btn" target="_blank" rel="noopener noreferrer">
              Open Website
            </Link>
          </div>
        </aside>

        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}

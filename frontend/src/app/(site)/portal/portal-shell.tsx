import type { ReactNode } from "react";
import Link from "next/link";
import type { CmsConfigPayload } from "@/lib/cms-api";
import type { PortalUser } from "@/lib/portal/types";
import { TemplateCmsFrame } from "@/components/template-cms-frame";
import { logoutPortalAction } from "@/app/(site)/login/actions";

type PortalShellProps = {
  cmsConfig: CmsConfigPayload;
  title: string;
  subtitle: string;
  user: PortalUser;
  children: ReactNode;
};

export function PortalShell({ cmsConfig, title, subtitle, user, children }: PortalShellProps) {
  return (
    <TemplateCmsFrame cmsConfig={cmsConfig}>
      <div className="main-page-wrapper">
        <section className="bg-pink-two pt-170 lg-pt-140 pb-120 lg-pb-90">
          <div className="container">
            <div className="portal-header-card admin-card">
              <div>
                <h2 className="admin-title">{title}</h2>
                <p className="admin-subtitle">{subtitle}</p>
              </div>
              <div className="portal-user-actions">
                <div className="portal-user-meta">
                  <div>{user.name}</div>
                  <small>{user.email}</small>
                </div>
                <form action={logoutPortalAction}>
                  <button className="admin-btn secondary" type="submit">Logout</button>
                </form>
                <Link href="/" className="admin-btn">Browse Site</Link>
              </div>
            </div>

            {children}
          </div>
        </section>
      </div>
    </TemplateCmsFrame>
  );
}

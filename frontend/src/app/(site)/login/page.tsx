import { redirect } from "next/navigation";
import { TemplateCmsFrame } from "@/components/template-cms-frame";
import { loginPortalAction } from "@/app/(site)/login/actions";
import { fetchCmsConfig } from "@/lib/cms-api";
import { getAuthenticatedPortalUser } from "@/lib/portal/auth";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    status?: string;
  }>;
};

function redirectPathForRole(role: "admin" | "agent" | "customer") {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "agent") {
    return "/portal/agent";
  }

  return "/portal/customer";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [cmsConfig, query, user] = await Promise.all([
    fetchCmsConfig(),
    searchParams,
    getAuthenticatedPortalUser(),
  ]);

  if (user) {
    redirect(redirectPathForRole(user.role));
  }

  return (
    <TemplateCmsFrame cmsConfig={cmsConfig}>
      <div className="main-page-wrapper">
        <section className="bg-pink-two pt-180 lg-pt-150 pb-120 lg-pb-90">
          <div className="container">
            <div className="portal-auth-card">
              <div className="title-one text-center mb-25">
                <h3>Portal Login</h3>
                <p className="fs-20 mt-10">
                  Sign in once. Admin, Agent, and Customer dashboards are routed automatically.
                </p>
              </div>

              {query.status === "logged-out" ? (
                <div className="alert alert-info">You have been logged out.</div>
              ) : null}
              {query.error ? (
                <div className="alert alert-danger">{query.error}</div>
              ) : null}

              <form action={loginPortalAction}>
                <div className="input-box-three mb-20">
                  <div className="label">Email*</div>
                  <input name="email" type="email" placeholder="you@example.com" required className="type-input" />
                </div>

                <div className="input-box-three mb-20">
                  <div className="label">Password*</div>
                  <input name="password" type="password" placeholder="Enter password" required className="type-input" />
                </div>

                <div className="agreement-checkbox d-flex justify-content-between align-items-center mb-30">
                  <div>
                    <input type="checkbox" id="portal-remember" name="remember" />
                    <label htmlFor="portal-remember">Keep me logged in</label>
                  </div>
                </div>

                <button className="btn-five w-100 text-uppercase" type="submit">Login</button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </TemplateCmsFrame>
  );
}

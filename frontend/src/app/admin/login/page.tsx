import { redirect } from "next/navigation";
import { loginAdminAction } from "@/app/admin/actions";
import { getAuthenticatedAdminUser } from "@/lib/admin/auth";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    status?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const adminUser = await getAuthenticatedAdminUser();

  if (adminUser) {
    redirect("/admin");
  }

  const query = await searchParams;
  const error = query.error;
  const status = query.status;

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <h2>Admin Login</h2>
        <p>Authenticate to manage CMS and platform operations.</p>

        {status === "logged-out" ? (
          <div className="admin-flash">You have been logged out.</div>
        ) : null}
        {error ? (
          <div className="admin-flash error">{error}</div>
        ) : null}

        <form action={loginAdminAction}>
          <div className="admin-field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" />
          </div>

          <div className="admin-field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>

          <div className="admin-field">
            <label htmlFor="remember">
              <input id="remember" name="remember" type="checkbox" /> Keep me signed in
            </label>
          </div>

          <button className="admin-btn" type="submit">Sign In</button>
        </form>
      </div>
    </div>
  );
}

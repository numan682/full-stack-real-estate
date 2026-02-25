import "server-only";

import { redirect } from "next/navigation";
import { fetchPortalMe } from "@/lib/portal/backend-client";
import { getPortalTokenFromCookie } from "@/lib/portal/session";
import type { PortalRole, PortalUser } from "@/lib/portal/types";

function redirectPathForRole(role: PortalRole): string {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "agent") {
    return "/portal/agent";
  }

  return "/portal/customer";
}

export async function requirePortalUser(allowedRoles?: PortalRole[]): Promise<PortalUser> {
  const token = await getPortalTokenFromCookie();

  if (!token) {
    redirect("/login");
  }

  const response = await fetchPortalMe(token);

  if (!response.ok || !response.data?.user) {
    // Cookie mutation is performed by this route handler, not during Server Component render.
    redirect("/logout?next=/login");
  }

  const user = response.data.user;

  if (!allowedRoles || allowedRoles.length === 0) {
    return user;
  }

  if (!allowedRoles.includes(user.role)) {
    redirect(redirectPathForRole(user.role));
  }

  return user;
}

export async function getAuthenticatedPortalUser(): Promise<PortalUser | null> {
  const token = await getPortalTokenFromCookie();

  if (!token) {
    return null;
  }

  const response = await fetchPortalMe(token);

  if (!response.ok || !response.data?.user) {
    return null;
  }

  return response.data.user;
}

import "server-only";

import { redirect } from "next/navigation";
import { getAdminTokenFromCookie } from "@/lib/admin/session";
import { fetchAdminMe } from "@/lib/admin/backend-client";
import type { AdminUser } from "@/lib/admin/types";

export async function requireAdminUser(): Promise<AdminUser> {
  const token = await getAdminTokenFromCookie();

  if (!token) {
    redirect("/admin/login");
  }

  const response = await fetchAdminMe();

  if (!response.ok || !response.data?.user) {
    // Cookie mutation is performed by this route handler, not during Server Component render.
    redirect("/admin/logout?next=/admin/login");
  }

  return response.data.user;
}

export async function getAuthenticatedAdminUser(): Promise<AdminUser | null> {
  const token = await getAdminTokenFromCookie();

  if (!token) {
    return null;
  }

  const response = await fetchAdminMe();

  if (!response.ok || !response.data?.user) {
    return null;
  }

  return response.data.user;
}

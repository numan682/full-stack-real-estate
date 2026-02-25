import "server-only";

import { cookies } from "next/headers";
import type { PortalRole } from "@/lib/portal/types";

export const PORTAL_TOKEN_COOKIE = "re_portal_token";
export const PORTAL_ROLE_COOKIE = "re_portal_role";
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 12;

export async function getPortalTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();

  return cookieStore.get(PORTAL_TOKEN_COOKIE)?.value ?? null;
}

export async function getPortalRoleFromCookie(): Promise<PortalRole | null> {
  const cookieStore = await cookies();
  const role = cookieStore.get(PORTAL_ROLE_COOKIE)?.value ?? null;

  if (role === "admin" || role === "agent" || role === "customer") {
    return role;
  }

  return null;
}

export async function setPortalSession(token: string, role: PortalRole, maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS) {
  const cookieStore = await cookies();

  cookieStore.set({
    name: PORTAL_TOKEN_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });

  cookieStore.set({
    name: PORTAL_ROLE_COOKIE,
    value: role,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearPortalSession() {
  const cookieStore = await cookies();
  cookieStore.delete(PORTAL_TOKEN_COOKIE);
  cookieStore.delete(PORTAL_ROLE_COOKIE);
}

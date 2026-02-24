import "server-only";

import { cookies } from "next/headers";

export const ADMIN_TOKEN_COOKIE = "re_admin_token";
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 12;

export async function getAdminTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();

  return cookieStore.get(ADMIN_TOKEN_COOKIE)?.value ?? null;
}

export async function setAdminTokenCookie(token: string, maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS) {
  const cookieStore = await cookies();

  cookieStore.set({
    name: ADMIN_TOKEN_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearAdminTokenCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_TOKEN_COOKIE);
}

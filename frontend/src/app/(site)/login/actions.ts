"use server";

import { redirect } from "next/navigation";
import { clearAdminTokenCookie, setAdminTokenCookie } from "@/lib/admin/session";
import { loginPortal, logoutPortal } from "@/lib/portal/backend-client";
import { clearPortalSession, getPortalTokenFromCookie, setPortalSession } from "@/lib/portal/session";

function getLoginErrorMessage(response: { message?: string; errors?: Record<string, string[]> }) {
  const firstValidationMessage = Object.values(response.errors ?? {})[0]?.[0];

  return firstValidationMessage ?? response.message ?? "Unable to sign in.";
}

export async function loginPortalAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = String(formData.get("remember") ?? "") === "on";

  if (!email || !password) {
    redirect("/login?error=Email%20and%20password%20are%20required");
  }

  const response = await loginPortal(email, password, remember);

  if (!response.ok || !response.data?.token || !response.data.user) {
    const message = encodeURIComponent(getLoginErrorMessage(response));
    redirect(`/login?error=${message}`);
  }

  const expiresAt = response.data.expires_at ? new Date(response.data.expires_at) : null;
  const now = Date.now();
  const maxAgeSeconds = expiresAt && !Number.isNaN(expiresAt.getTime())
    ? Math.max(60, Math.floor((expiresAt.getTime() - now) / 1000))
    : remember ? 60 * 60 * 24 * 7 : 60 * 60 * 12;

  await setPortalSession(response.data.token, response.data.user.role, maxAgeSeconds);

  if (response.data.user.role === "admin") {
    await setAdminTokenCookie(response.data.token, maxAgeSeconds);
  } else {
    await clearAdminTokenCookie();
  }

  redirect(response.data.redirect_path || "/");
}

export async function logoutPortalAction() {
  const token = await getPortalTokenFromCookie();

  if (token) {
    await logoutPortal(token);
  }

  await clearPortalSession();
  await clearAdminTokenCookie();
  redirect("/login?status=logged-out");
}

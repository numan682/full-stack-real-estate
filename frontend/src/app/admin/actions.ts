"use server";

import { redirect } from "next/navigation";
import { loginAdmin, logoutAdmin } from "@/lib/admin/backend-client";
import {
  clearAdminTokenCookie,
  getAdminTokenFromCookie,
  setAdminTokenCookie,
} from "@/lib/admin/session";

function getLoginErrorMessage(response: { message?: string; errors?: Record<string, string[]> }) {
  const firstValidationMessage = Object.values(response.errors ?? {})[0]?.[0];

  return firstValidationMessage ?? response.message ?? "Unable to sign in.";
}

export async function loginAdminAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = String(formData.get("remember") ?? "") === "on";

  if (!email || !password) {
    redirect("/admin/login?error=Email%20and%20password%20are%20required");
  }

  const response = await loginAdmin(email, password, remember);

  if (!response.ok || !response.data?.token) {
    const message = encodeURIComponent(getLoginErrorMessage(response));
    redirect(`/admin/login?error=${message}`);
  }

  const expiresAt = response.data.expires_at ? new Date(response.data.expires_at) : null;
  const now = Date.now();
  const maxAgeSeconds = expiresAt && !Number.isNaN(expiresAt.getTime())
    ? Math.max(60, Math.floor((expiresAt.getTime() - now) / 1000))
    : remember ? 60 * 60 * 24 * 7 : 60 * 60 * 12;

  await setAdminTokenCookie(response.data.token, maxAgeSeconds);

  redirect("/admin");
}

export async function logoutAdminAction() {
  const token = await getAdminTokenFromCookie();

  if (token) {
    await logoutAdmin(token);
  }

  await clearAdminTokenCookie();

  redirect("/admin/login?status=logged-out");
}

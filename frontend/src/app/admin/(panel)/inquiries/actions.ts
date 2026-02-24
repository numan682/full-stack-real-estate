"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateAdminInquiryStatus } from "@/lib/admin/backend-client";
import { requireAdminUser } from "@/lib/admin/auth";
import type { AdminInquiry } from "@/lib/admin/types";

export async function updateInquiryStatusAction(formData: FormData) {
  await requireAdminUser();

  const inquiryId = Number.parseInt(String(formData.get("inquiry_id") ?? ""), 10);
  const status = String(formData.get("status") ?? "") as AdminInquiry["status"];

  if (!Number.isInteger(inquiryId) || inquiryId < 1) {
    redirect("/admin/inquiries?error=Invalid%20inquiry%20id");
  }

  if (!["new", "contacted", "resolved", "spam"].includes(status)) {
    redirect("/admin/inquiries?error=Invalid%20status");
  }

  const response = await updateAdminInquiryStatus(inquiryId, status);

  if (!response.ok) {
    redirect(`/admin/inquiries?error=${encodeURIComponent(response.message ?? "Failed to update inquiry status.")}`);
  }

  revalidatePath("/admin/inquiries");
  redirect("/admin/inquiries?status=inquiry-updated");
}

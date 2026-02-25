"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAgentProperty,
  updateAgentInquiryStatus,
} from "@/lib/portal/backend-client";
import { requirePortalUser } from "@/lib/portal/auth";
import type { AdminInquiry } from "@/lib/admin/types";

function toNumberOrNull(value: FormDataEntryValue | null): number | null {
  const parsed = Number.parseFloat(String(value ?? "").trim());

  return Number.isFinite(parsed) ? parsed : null;
}

function toIntegerOrNull(value: FormDataEntryValue | null): number | null {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);

  return Number.isInteger(parsed) ? parsed : null;
}

function parseFeaturesJson(raw: string) {
  if (!raw.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeStatus(raw: string): AdminInquiry["status"] {
  if (raw === "contacted" || raw === "resolved" || raw === "spam") {
    return raw;
  }

  return "new";
}

export async function createAgentPropertyAction(formData: FormData) {
  await requirePortalUser(["agent"]);

  const primaryImagePath = String(formData.get("primary_image_path") ?? "").trim();
  const payload = {
    title: String(formData.get("title") ?? "").trim(),
    property_type: String(formData.get("property_type") ?? "").trim() || "Apartment",
    listing_type: String(formData.get("listing_type") ?? "sale"),
    status: String(formData.get("status") ?? "draft"),
    price: toNumberOrNull(formData.get("price")) ?? 0,
    address_line: String(formData.get("address_line") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    state: String(formData.get("state") ?? "").trim(),
    postal_code: String(formData.get("postal_code") ?? "").trim(),
    country: String(formData.get("country") ?? "").trim() || "United States",
    bedrooms: toIntegerOrNull(formData.get("bedrooms")),
    bathrooms: toIntegerOrNull(formData.get("bathrooms")),
    area_sqft: toIntegerOrNull(formData.get("area_sqft")),
    description: String(formData.get("description") ?? "").trim(),
    features: parseFeaturesJson(String(formData.get("features_json") ?? "[]")),
    images: primaryImagePath
      ? [{
        path: primaryImagePath,
        alt_text: String(formData.get("primary_image_alt") ?? "").trim(),
        sort_order: 10,
        is_primary: true,
      }]
      : [],
  };

  if (!payload.title || !payload.address_line || !payload.city || payload.price <= 0) {
    redirect("/portal/agent?error=Title%2C%20price%2C%20address%20and%20city%20are%20required");
  }

  const response = await createAgentProperty(payload);

  if (!response.ok) {
    redirect(`/portal/agent?error=${encodeURIComponent(response.message ?? "Failed to create listing.")}`);
  }

  revalidatePath("/portal/agent");
  revalidatePath("/properties");
  redirect("/portal/agent?status=property-created");
}

export async function updateAgentInquiryStatusAction(formData: FormData) {
  await requirePortalUser(["agent"]);

  const inquiryId = Number.parseInt(String(formData.get("inquiry_id") ?? ""), 10);
  const status = normalizeStatus(String(formData.get("status") ?? "new"));

  if (!Number.isInteger(inquiryId) || inquiryId < 1) {
    redirect("/portal/agent?error=Invalid%20inquiry%20id");
  }

  const response = await updateAgentInquiryStatus(inquiryId, status);

  if (!response.ok) {
    redirect(`/portal/agent?error=${encodeURIComponent(response.message ?? "Failed to update inquiry status.")}`);
  }

  revalidatePath("/portal/agent");
  redirect("/portal/agent?status=ticket-updated");
}

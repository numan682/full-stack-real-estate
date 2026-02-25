"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAdminProperty,
  deleteAdminProperty,
} from "@/lib/admin/backend-client";
import { requireAdminUser } from "@/lib/admin/auth";

const IMAGE_SLOT_COUNT = 6;

function toNumberOrNull(value: FormDataEntryValue | null): number | null {
  const parsed = Number.parseFloat(String(value ?? "").trim());

  return Number.isFinite(parsed) ? parsed : null;
}

function toIntegerOrNull(value: FormDataEntryValue | null): number | null {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);

  return Number.isInteger(parsed) ? parsed : null;
}

function parseFeatureValues(formData: FormData): string[] {
  const selected = formData
    .getAll("feature_values")
    .map((value) => String(value ?? "").trim())
    .filter((value) => value !== "");
  const custom = String(formData.get("feature_custom") ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter((item) => item !== "");

  return [...new Set([...selected, ...custom])];
}

function parseImageSlots(formData: FormData) {
  const selectedPrimarySlot = Number.parseInt(String(formData.get("primary_image_slot") ?? ""), 10);
  const requestedSlotCount = Number.parseInt(String(formData.get("image_slot_count") ?? ""), 10);
  const slotCount = Number.isInteger(requestedSlotCount) && requestedSlotCount > 0
    ? Math.min(requestedSlotCount, 24)
    : IMAGE_SLOT_COUNT;
  const images: Array<{
    path: string;
    alt_text: string;
    sort_order: number;
    is_primary: boolean;
  }> = [];

  for (let slot = 1; slot <= slotCount; slot++) {
    const path = String(formData.get(`image_path_${slot}`) ?? "").trim();
    if (!path) {
      continue;
    }

    images.push({
      path,
      alt_text: String(formData.get(`image_alt_${slot}`) ?? "").trim(),
      sort_order: slot * 10,
      is_primary: selectedPrimarySlot === slot,
    });
  }

  if (images.length > 0 && !images.some((image) => image.is_primary)) {
    images[0].is_primary = true;
  }

  return images;
}

export async function createPropertyAction(formData: FormData) {
  await requireAdminUser();

  const payload = {
    title: String(formData.get("title") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    agent_id: toIntegerOrNull(formData.get("agent_id")),
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
    latitude: toNumberOrNull(formData.get("latitude")),
    longitude: toNumberOrNull(formData.get("longitude")),
    description: String(formData.get("description") ?? "").trim(),
    is_featured: String(formData.get("is_featured") ?? "") === "on",
    features: parseFeatureValues(formData),
    images: parseImageSlots(formData),
  };

  if (!payload.title || !payload.address_line || !payload.city || payload.price <= 0) {
    redirect("/admin/properties/new?error=Title%2C%20price%2C%20address%20and%20city%20are%20required");
  }

  const response = await createAdminProperty(payload);

  if (!response.ok) {
    redirect(`/admin/properties/new?error=${encodeURIComponent(response.message ?? "Failed to create property.")}`);
  }

  revalidatePath("/admin/properties");
  revalidatePath("/admin/properties/new");
  redirect("/admin/properties?status=property-created");
}

export async function deletePropertyAction(formData: FormData) {
  await requireAdminUser();

  const propertyId = Number.parseInt(String(formData.get("property_id") ?? ""), 10);

  if (!Number.isInteger(propertyId) || propertyId < 1) {
    redirect("/admin/properties?error=Invalid%20property%20id");
  }

  const response = await deleteAdminProperty(propertyId);

  if (!response.ok) {
    redirect(`/admin/properties?error=${encodeURIComponent(response.message ?? "Failed to delete property.")}`);
  }

  revalidatePath("/admin/properties");
  redirect("/admin/properties?status=property-deleted");
}

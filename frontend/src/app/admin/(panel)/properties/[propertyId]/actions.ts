"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateAdminProperty } from "@/lib/admin/backend-client";
import { requireAdminUser } from "@/lib/admin/auth";

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

function parseImagesJson(raw: string) {
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

export async function updatePropertyAction(formData: FormData) {
  await requireAdminUser();

  const propertyId = Number.parseInt(String(formData.get("property_id") ?? ""), 10);

  if (!Number.isInteger(propertyId) || propertyId < 1) {
    redirect("/admin/properties?error=Invalid%20property%20id");
  }

  const payload = {
    title: String(formData.get("title") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
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
    is_featured: String(formData.get("is_featured") ?? "") === "on",
    features: parseFeaturesJson(String(formData.get("features_json") ?? "[]")),
    images: parseImagesJson(String(formData.get("images_json") ?? "[]")),
    latitude: toNumberOrNull(formData.get("latitude")),
    longitude: toNumberOrNull(formData.get("longitude")),
  };

  if (!payload.title || !payload.address_line || !payload.city || payload.price <= 0) {
    redirect(`/admin/properties/${propertyId}?error=Title%2C%20price%2C%20address%20and%20city%20are%20required`);
  }

  const response = await updateAdminProperty(propertyId, payload);

  if (!response.ok) {
    redirect(`/admin/properties/${propertyId}?error=${encodeURIComponent(response.message ?? "Failed to update property.")}`);
  }

  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${propertyId}`);
  redirect(`/admin/properties/${propertyId}?status=property-updated`);
}

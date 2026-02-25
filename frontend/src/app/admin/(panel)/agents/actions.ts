"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminAgent, deleteAdminAgent } from "@/lib/admin/backend-client";
import { requireAdminUser } from "@/lib/admin/auth";

function toIntegerOrNull(value: FormDataEntryValue | null): number | null {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function toNullableString(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized === "" ? null : normalized;
}

export async function createAgentAction(formData: FormData) {
  await requireAdminUser();

  const payload = {
    agency_id: toIntegerOrNull(formData.get("agency_id")),
    first_name: String(formData.get("first_name") ?? "").trim(),
    last_name: String(formData.get("last_name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: toNullableString(formData.get("phone")),
    avatar_path: toNullableString(formData.get("avatar_path")),
    position: toNullableString(formData.get("position")),
    bio: toNullableString(formData.get("bio")),
    is_active: String(formData.get("is_active") ?? "") === "on",
  };

  if (!payload.first_name || !payload.last_name || !payload.email) {
    redirect("/admin/agents/new?error=First%20name%2C%20last%20name%20and%20email%20are%20required");
  }

  const response = await createAdminAgent(payload);

  if (!response.ok) {
    redirect(`/admin/agents/new?error=${encodeURIComponent(response.message ?? "Failed to create agent.")}`);
  }

  revalidatePath("/admin/agents");
  revalidatePath("/admin/agents/new");
  redirect("/admin/agents?status=agent-created");
}

export async function deleteAgentAction(formData: FormData) {
  await requireAdminUser();

  const agentId = Number.parseInt(String(formData.get("agent_id") ?? ""), 10);
  if (!Number.isInteger(agentId) || agentId < 1) {
    redirect("/admin/agents?error=Invalid%20agent%20id");
  }

  const response = await deleteAdminAgent(agentId);
  if (!response.ok) {
    redirect(`/admin/agents?error=${encodeURIComponent(response.message ?? "Failed to delete agent.")}`);
  }

  revalidatePath("/admin/agents");
  redirect("/admin/agents?status=agent-deleted");
}

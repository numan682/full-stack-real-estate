"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateAdminBlog } from "@/lib/admin/backend-client";
import { requireAdminUser } from "@/lib/admin/auth";

function parseSeoPayload(raw: string) {
  if (!raw.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export async function updateBlogAction(formData: FormData) {
  await requireAdminUser();

  const blogId = Number.parseInt(String(formData.get("blog_id") ?? ""), 10);

  if (!Number.isInteger(blogId) || blogId < 1) {
    redirect("/admin/blogs?error=Invalid%20blog%20id");
  }

  const payload = {
    title: String(formData.get("title") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    status: String(formData.get("status") ?? "draft"),
    author_name: String(formData.get("author_name") ?? "").trim(),
    featured_image_path: String(formData.get("featured_image_path") ?? "").trim(),
    featured_image_alt: String(formData.get("featured_image_alt") ?? "").trim(),
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    content: String(formData.get("content") ?? "").trim(),
    published_at: String(formData.get("published_at") ?? "").trim(),
    is_featured: String(formData.get("is_featured") ?? "") === "on",
    seo_payload: parseSeoPayload(String(formData.get("seo_payload_json") ?? "{}")),
  };

  if (!payload.title) {
    redirect(`/admin/blogs/${blogId}?error=Title%20is%20required`);
  }

  const response = await updateAdminBlog(blogId, payload);

  if (!response.ok) {
    redirect(`/admin/blogs/${blogId}?error=${encodeURIComponent(response.message ?? "Failed to update blog post.")}`);
  }

  revalidatePath("/admin/blogs");
  revalidatePath(`/admin/blogs/${blogId}`);
  redirect(`/admin/blogs/${blogId}?status=blog-updated`);
}

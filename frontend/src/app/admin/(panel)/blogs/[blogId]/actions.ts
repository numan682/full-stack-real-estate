"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateAdminBlog } from "@/lib/admin/backend-client";
import { requireAdminUser } from "@/lib/admin/auth";

function parseSeoPayload(formData: FormData) {
  const title = String(formData.get("seo_meta_title") ?? "").trim();
  const description = String(formData.get("seo_meta_description") ?? "").trim();
  const canonical = String(formData.get("seo_canonical_url") ?? "").trim();
  const robots = String(formData.get("seo_robots") ?? "").trim();
  const keywords = String(formData.get("seo_meta_keywords") ?? "")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword !== "");

  const payload: Record<string, unknown> = {};

  if (title) {
    payload.title = title;
  }

  if (description) {
    payload.description = description;
  }

  if (canonical) {
    payload.canonical = canonical;
  }

  if (keywords.length > 0) {
    payload.keywords = keywords;
  }

  if (robots) {
    payload.robots = robots;
  }

  return payload;
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
    seo_payload: parseSeoPayload(formData),
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

import { TinyMceField } from "@/components/admin/tinymce-field";
import type { AdminBlogPost } from "@/lib/admin/types";

type BlogFormFieldsProps = {
  post?: AdminBlogPost;
};

function getSeoValue(payload: AdminBlogPost["seo_payload"], key: string) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const value = payload[key];
  return typeof value === "string" ? value : "";
}

function getSeoKeywords(payload: AdminBlogPost["seo_payload"]) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const keywords = payload.keywords;
  if (Array.isArray(keywords)) {
    return keywords
      .map((keyword) => String(keyword).trim())
      .filter((keyword) => keyword !== "")
      .join(", ");
  }

  if (typeof keywords === "string") {
    return keywords;
  }

  return "";
}

export function BlogFormFields({ post }: BlogFormFieldsProps) {
  return (
    <div className="admin-form-shell">
      <section className="admin-form-section">
        <h3>Post Details</h3>
        <p>Core publishing and author information.</p>

        <div className="admin-row">
          <div className="admin-field" style={{ gridColumn: "span 6" }}>
            <label htmlFor="title">Title</label>
            <input id="title" name="title" defaultValue={post?.title ?? ""} required />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 3" }}>
            <label htmlFor="slug">Slug (Optional)</label>
            <input id="slug" name="slug" defaultValue={post?.slug ?? ""} placeholder="auto-generated-if-empty" />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 3" }}>
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={post?.status ?? "draft"}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="admin-field" style={{ gridColumn: "span 4" }}>
            <label htmlFor="author_name">Author</label>
            <input id="author_name" name="author_name" defaultValue={post?.author_name ?? ""} />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 4" }}>
            <label htmlFor="published_at">Published At (Optional ISO)</label>
            <input
              id="published_at"
              name="published_at"
              defaultValue={post?.published_at ?? ""}
              placeholder="2026-02-24T10:00:00Z"
            />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 4" }}>
            <label htmlFor="is_featured">
              <input id="is_featured" name="is_featured" type="checkbox" defaultChecked={post?.is_featured ?? false} /> Mark as featured
            </label>
          </div>
        </div>
      </section>

      <section className="admin-form-section">
        <h3>Media & Summary</h3>
        <p>Featured image and summary text for cards and previews.</p>

        <div className="admin-row">
          <div className="admin-field" style={{ gridColumn: "span 8" }}>
            <label htmlFor="featured_image_path">Featured Image Path</label>
            <input
              id="featured_image_path"
              name="featured_image_path"
              defaultValue={post?.featured_image_path ?? ""}
              placeholder="/images/blog/blog_01.jpg"
            />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 4" }}>
            <label htmlFor="featured_image_alt">Image Alt Text</label>
            <input
              id="featured_image_alt"
              name="featured_image_alt"
              defaultValue={post?.featured_image_alt ?? ""}
            />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 12" }}>
            <label htmlFor="excerpt">Excerpt</label>
            <textarea
              id="excerpt"
              name="excerpt"
              defaultValue={post?.excerpt ?? ""}
              placeholder="Short summary for cards, search snippets, and social previews."
            />
          </div>
        </div>
      </section>

      <section className="admin-form-section">
        <h3>Content</h3>
        <p>Edit full post content visually with TinyMCE.</p>
        <TinyMceField
          id="content_editor"
          name="content"
          label="Body Content"
          initialValue={post?.content ?? ""}
          height={420}
        />
      </section>

      <section className="admin-form-section">
        <h3>SEO Settings</h3>
        <p>Optional SEO fields for metadata and robots behavior.</p>

        <div className="admin-row">
          <div className="admin-field" style={{ gridColumn: "span 6" }}>
            <label htmlFor="seo_meta_title">SEO Title</label>
            <input
              id="seo_meta_title"
              name="seo_meta_title"
              defaultValue={getSeoValue(post?.seo_payload, "title")}
              placeholder="Custom page title"
            />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 6" }}>
            <label htmlFor="seo_canonical_url">Canonical URL</label>
            <input
              id="seo_canonical_url"
              name="seo_canonical_url"
              defaultValue={getSeoValue(post?.seo_payload, "canonical")}
              placeholder="https://example.com/blog/post-slug"
            />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 12" }}>
            <label htmlFor="seo_meta_description">SEO Description</label>
            <textarea
              id="seo_meta_description"
              name="seo_meta_description"
              defaultValue={getSeoValue(post?.seo_payload, "description")}
              placeholder="Describe this post for search engines."
            />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 8" }}>
            <label htmlFor="seo_meta_keywords">SEO Keywords (comma separated)</label>
            <input
              id="seo_meta_keywords"
              name="seo_meta_keywords"
              defaultValue={getSeoKeywords(post?.seo_payload)}
              placeholder="real estate, buying guide, investment"
            />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 4" }}>
            <label htmlFor="seo_robots">Robots</label>
            <select id="seo_robots" name="seo_robots" defaultValue={getSeoValue(post?.seo_payload, "robots") || "index,follow"}>
              <option value="index,follow">index,follow</option>
              <option value="index,nofollow">index,nofollow</option>
              <option value="noindex,follow">noindex,follow</option>
              <option value="noindex,nofollow">noindex,nofollow</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import { updateBlogAction } from "@/app/admin/(panel)/blogs/[blogId]/actions";
import { fetchAdminBlog } from "@/lib/admin/backend-client";

type BlogEditPageProps = {
  params: Promise<{
    blogId: string;
  }>;
  searchParams: Promise<{
    status?: string;
    error?: string;
  }>;
};

export default async function BlogEditPage({ params, searchParams }: BlogEditPageProps) {
  const resolvedParams = await params;
  const query = await searchParams;
  const blogId = Number.parseInt(resolvedParams.blogId, 10);

  if (!Number.isInteger(blogId) || blogId < 1) {
    return (
      <section>
        <h2 className="admin-title">Edit Blog Post</h2>
        <div className="admin-flash error">Invalid blog post id.</div>
      </section>
    );
  }

  const response = await fetchAdminBlog(blogId);

  if (!response.ok || !response.data) {
    return (
      <section>
        <h2 className="admin-title">Edit Blog Post</h2>
        <div className="admin-flash error">{response.message ?? "Failed to load blog post."}</div>
      </section>
    );
  }

  const post = response.data;

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2 className="admin-title">Edit Blog #{post.id}</h2>
          <p className="admin-subtitle">Update slug, content, publishing state, and SEO payload.</p>
        </div>
        <div className="admin-actions">
          <Link className="admin-btn secondary" href="/admin/blogs">Back to Blogs</Link>
        </div>
      </div>

      {query.status === "blog-updated" ? (
        <div className="admin-flash">Blog post updated successfully.</div>
      ) : null}
      {query.error ? (
        <div className="admin-flash error">{query.error}</div>
      ) : null}

      <div className="admin-card">
        <form action={updateBlogAction}>
          <input type="hidden" name="blog_id" value={post.id} />

          <div className="admin-row">
            <div className="admin-field" style={{ gridColumn: "span 6" }}>
              <label htmlFor="title">Title</label>
              <input id="title" name="title" defaultValue={post.title} required />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="slug">Slug</label>
              <input id="slug" name="slug" defaultValue={post.slug} />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue={post.status}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="admin-field" style={{ gridColumn: "span 4" }}>
              <label htmlFor="author_name">Author</label>
              <input id="author_name" name="author_name" defaultValue={post.author_name ?? ""} />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 4" }}>
              <label htmlFor="published_at">Published At (ISO Optional)</label>
              <input
                id="published_at"
                name="published_at"
                defaultValue={post.published_at ?? ""}
                placeholder="2026-02-24T10:00:00Z"
              />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 4" }}>
              <label htmlFor="featured_image_path">Featured Image Path</label>
              <input
                id="featured_image_path"
                name="featured_image_path"
                defaultValue={post.featured_image_path ?? ""}
              />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 6" }}>
              <label htmlFor="featured_image_alt">Featured Image Alt</label>
              <input
                id="featured_image_alt"
                name="featured_image_alt"
                defaultValue={post.featured_image_alt ?? ""}
              />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 6" }}>
              <label htmlFor="excerpt">Excerpt</label>
              <textarea id="excerpt" name="excerpt" defaultValue={post.excerpt ?? ""} />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 12" }}>
              <label htmlFor="content">Content</label>
              <textarea id="content" name="content" defaultValue={post.content ?? ""} />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 12" }}>
              <label htmlFor="seo_payload_json">SEO Payload (JSON Object)</label>
              <textarea
                id="seo_payload_json"
                name="seo_payload_json"
                defaultValue={JSON.stringify(post.seo_payload ?? {}, null, 2)}
              />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 12" }}>
              <label htmlFor="is_featured">
                <input id="is_featured" name="is_featured" type="checkbox" defaultChecked={post.is_featured} /> Mark as featured
              </label>
            </div>
          </div>

          <div className="admin-actions" style={{ marginTop: 10 }}>
            <button className="admin-btn" type="submit">Save Changes</button>
          </div>
        </form>
      </div>
    </section>
  );
}

import Link from "next/link";
import { updateBlogAction } from "@/app/admin/(panel)/blogs/[blogId]/actions";
import { BlogFormFields } from "@/app/admin/(panel)/blogs/blog-form-fields";
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
          <p className="admin-subtitle">Update content, publishing state, and SEO using visual form inputs.</p>
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
          <BlogFormFields post={post} />

          <div className="admin-actions" style={{ marginTop: 14 }}>
            <button className="admin-btn" type="submit">Save Changes</button>
          </div>
        </form>
      </div>
    </section>
  );
}

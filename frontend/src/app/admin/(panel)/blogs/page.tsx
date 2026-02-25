import Link from "next/link";
import { deleteBlogAction } from "@/app/admin/(panel)/blogs/actions";
import { fetchAdminBlogs } from "@/lib/admin/backend-client";

type BlogsPageProps = {
  searchParams: Promise<{
    status?: string;
    error?: string;
    search?: string;
    status_filter?: string;
  }>;
};

function statusMessage(status?: string) {
  if (status === "blog-created") {
    return "Blog post created successfully.";
  }

  if (status === "blog-deleted") {
    return "Blog post deleted successfully.";
  }

  if (status === "blog-updated") {
    return "Blog post updated successfully.";
  }

  return null;
}

export default async function AdminBlogsPage({ searchParams }: BlogsPageProps) {
  const query = await searchParams;
  const queryString = new URLSearchParams();

  if (query.search) {
    queryString.set("search", query.search);
  }

  if (query.status_filter) {
    queryString.set("status", query.status_filter);
  }

  queryString.set("per_page", "30");

  const response = await fetchAdminBlogs(queryString.toString());
  const posts = response.data?.data ?? [];
  const status = statusMessage(query.status);

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2 className="admin-title">Blogs</h2>
          <p className="admin-subtitle">Manage dynamic blog content and publishing workflow.</p>
        </div>
        <div className="admin-actions">
          <Link className="admin-btn" href="/admin/blogs/new">Add Blog Post</Link>
        </div>
      </div>

      {status ? <div className="admin-flash">{status}</div> : null}
      {query.error ? <div className="admin-flash error">{query.error}</div> : null}

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>Blog Posts</h3>
        {!response.ok ? (
          <div className="admin-flash error">{response.message ?? "Failed to load blog posts."}</div>
        ) : null}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Author</th>
                <th>Published</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>{post.id}</td>
                  <td>{post.title}</td>
                  <td>{post.status}</td>
                  <td>{post.is_featured ? "Yes" : "No"}</td>
                  <td>{post.author_name ?? "-"}</td>
                  <td>{post.published_at ? new Date(post.published_at).toLocaleString() : "-"}</td>
                  <td>{post.updated_at ? new Date(post.updated_at).toLocaleString() : "-"}</td>
                  <td>
                    <div className="admin-actions">
                      <Link className="admin-btn secondary" href={`/admin/blogs/${post.id}`}>
                        Edit
                      </Link>
                      <form action={deleteBlogAction}>
                        <input type="hidden" name="blog_id" value={post.id} />
                        <button className="admin-btn danger" type="submit">Delete</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={8}>No blog posts found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

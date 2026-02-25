import Link from "next/link";
import { createBlogAction } from "@/app/admin/(panel)/blogs/actions";
import { BlogFormFields } from "@/app/admin/(panel)/blogs/blog-form-fields";

type NewBlogPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewBlogPage({ searchParams }: NewBlogPageProps) {
  const query = await searchParams;

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2 className="admin-title">Create Blog Post</h2>
          <p className="admin-subtitle">Write and publish posts with a visual editor and structured SEO form.</p>
        </div>
        <div className="admin-actions">
          <Link className="admin-btn secondary" href="/admin/blogs">Back to Blogs</Link>
        </div>
      </div>

      {query.error ? (
        <div className="admin-flash error">{query.error}</div>
      ) : null}

      <div className="admin-card">
        <form action={createBlogAction}>
          <BlogFormFields />
          <div className="admin-actions" style={{ marginTop: 14 }}>
            <button className="admin-btn" type="submit">Create Blog Post</button>
          </div>
        </form>
      </div>
    </section>
  );
}

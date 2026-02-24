import Link from "next/link";
import { notFound } from "next/navigation";
import { TemplatePageShell } from "@/components/template-page-shell";
import { LoginModal } from "@/features/shared/login-modal";
import { ScrollTopButton } from "@/features/shared/scroll-top";
import { cmsThemeScripts } from "@/features/cms/cms-theme-scripts";
import { fetchPublicBlog } from "@/lib/public-api";

type DynamicBlogPostPageProps = {
  listRoutePath: string;
  postSlug: string;
};

function formatDate(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function splitParagraphs(content?: string | null) {
  if (!content) {
    return [];
  }

  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== "");
}

export async function DynamicBlogPostPage({
  listRoutePath,
  postSlug,
}: DynamicBlogPostPageProps) {
  const response = await fetchPublicBlog(postSlug);
  const post = response.data;

  if (!response.ok || !post) {
    notFound();
  }

  const paragraphs = splitParagraphs(post.content);
  const listPath = listRoutePath === "" ? "/" : listRoutePath;

  return (
    <TemplatePageShell scripts={cmsThemeScripts}>
      <div className="main-page-wrapper">
        <section className="inner-banner-one inner-banner bg-pink text-center z-1 pt-160 lg-pt-130 pb-110 xl-pb-80 md-pb-60 position-relative">
          <div className="container">
            <h3 className="mb-20 xl-mb-15 pt-15">{post.title}</h3>
            <p className="fs-22">{formatDate(post.published_at)}</p>
          </div>
          <img src="/images/lazy.svg" data-src="/images/assets/ils_07.svg" alt="" className="lazy-img shapes w-100 illustration" />
        </section>

        <section className="blog-details-one mt-120 xl-mt-90 pb-120 xl-pb-90">
          <div className="container">
            <div className="mb-35">
              <Link href={listPath} className="btn-three">
                <span>Back to Blog</span>
              </Link>
            </div>

            <article className="blog-details-post">
              <figure className="mb-35">
                <img
                  src={post.featured_image_path ?? "/images/blog/blog_01.jpg"}
                  alt={post.featured_image_alt ?? post.title}
                  className="w-100 border-25"
                />
              </figure>

              <div className="post-meta mb-25">
                <span className="me-3">{formatDate(post.published_at)}</span>
                <span>{post.author_name ?? "Editorial Team"}</span>
              </div>

              {post.excerpt ? <p className="fs-22 mb-30">{post.excerpt}</p> : null}

              {paragraphs.length > 0 ? (
                paragraphs.map((paragraph, index) => (
                  <p key={`${post.slug}-paragraph-${index}`} className="mb-25">
                    {paragraph}
                  </p>
                ))
              ) : (
                <p>No article body content has been added yet.</p>
              )}
            </article>
          </div>
        </section>

        <LoginModal />
        <ScrollTopButton />
      </div>
    </TemplatePageShell>
  );
}

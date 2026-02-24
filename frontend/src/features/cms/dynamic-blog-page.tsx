import Link from "next/link";
import { TemplatePageShell } from "@/components/template-page-shell";
import { LoginModal } from "@/features/shared/login-modal";
import { ScrollTopButton } from "@/features/shared/scroll-top";
import { cmsThemeScripts } from "@/features/cms/cms-theme-scripts";
import { fetchPublicBlogs } from "@/lib/public-api";

type DynamicBlogPageProps = {
  routePath: string;
  pageTitle?: string | null;
  pageContent?: Record<string, unknown>;
};

function toStringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
}

function toIntegerValue(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function toBooleanValue(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["1", "true", "yes", "on"].includes(value.toLowerCase());
  }

  return fallback;
}

function blogDetailsUrl(routePath: string, slug: string) {
  const normalizedBase = routePath === "/" ? "" : routePath.replace(/\/+$/, "");
  return `${normalizedBase}/${slug}`;
}

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
    month: "short",
    day: "numeric",
  });
}

export async function DynamicBlogPage({
  routePath,
  pageTitle,
  pageContent,
}: DynamicBlogPageProps) {
  const title = toStringValue(pageContent?.hero_title, pageTitle ?? "Blog");
  const subtitle = toStringValue(
    pageContent?.hero_subtitle,
    "Latest updates, insights, and property market guides from our team.",
  );
  const emptyMessage = toStringValue(
    pageContent?.empty_message,
    "No published blog posts yet. Publish posts from the admin portal.",
  );
  const perPage = toIntegerValue(pageContent?.per_page, 9);
  const featuredOnly = toBooleanValue(pageContent?.featured_only, false);

  const response = await fetchPublicBlogs({
    per_page: perPage,
    sort: "newest",
    ...(featuredOnly ? { featured: true } : {}),
  });
  const posts = response.data ?? [];

  return (
    <TemplatePageShell scripts={cmsThemeScripts}>
      <div className="main-page-wrapper">
        <section className="inner-banner-one inner-banner bg-pink text-center z-1 pt-160 lg-pt-130 pb-110 xl-pb-80 md-pb-60 position-relative">
          <div className="container">
            <h3 className="mb-20 xl-mb-15 pt-15">{title}</h3>
            <p className="fs-22">{subtitle}</p>
          </div>
          <img src="/images/lazy.svg" data-src="/images/assets/ils_07.svg" alt="" className="lazy-img shapes w-100 illustration" />
        </section>

        <section className="blog-section-one mt-120 xl-mt-90 pb-120 xl-pb-90">
          <div className="container">
            {!response.ok ? (
              <div className="alert alert-danger mb-30">
                {response.message ?? "Unable to load blog posts at this moment."}
              </div>
            ) : null}

            <div className="row">
              {posts.map((post) => (
                <div className="col-lg-4 col-md-6 d-flex mt-35 wow fadeInUp" key={post.id}>
                  <article className="blog-meta-two style-two wow fadeInUp h-100 w-100">
                    <figure className="post-img m0">
                      <Link href={blogDetailsUrl(routePath, post.slug)} className="w-100 d-block">
                        <img
                          src={post.featured_image_path ?? "/images/blog/blog_01.jpg"}
                          alt={post.featured_image_alt ?? post.title}
                          className="w-100"
                        />
                      </Link>
                    </figure>
                    <div className="post-data">
                      <div className="post-info">{formatDate(post.published_at)}</div>
                      <div className="blog-title">
                        <Link href={blogDetailsUrl(routePath, post.slug)}>
                          {post.title}
                        </Link>
                      </div>
                      <p>{post.excerpt ?? "Read the full article for complete details."}</p>
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="fs-14">{post.author_name ?? "Editorial Team"}</span>
                        <Link href={blogDetailsUrl(routePath, post.slug)} className="read-btn rounded-circle tran3s">
                          <i className="bi bi-arrow-up-right"></i>
                        </Link>
                      </div>
                    </div>
                  </article>
                </div>
              ))}
            </div>

            {posts.length === 0 ? (
              <div className="text-center mt-60">
                <p className="fs-20">{emptyMessage}</p>
              </div>
            ) : null}
          </div>
        </section>

        <LoginModal />
        <ScrollTopButton />
      </div>
    </TemplatePageShell>
  );
}

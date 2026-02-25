import { HomePageTemplate, homePageMetadata } from "@/features/home/home-page";
import { DynamicBlogPage } from "@/features/cms/dynamic-blog-page";
import { DynamicBlogPostPage } from "@/features/cms/dynamic-blog-post-page";
import { DynamicAgentsPage } from "@/features/cms/dynamic-agents-page";
import { DynamicAgentDetailsPage } from "@/features/cms/dynamic-agent-details-page";
import { DynamicCmsPage } from "@/features/cms/dynamic-page";
import { DynamicListingsPage } from "@/features/cms/dynamic-listings-page";
import { DynamicPropertyDetailsPage } from "@/features/cms/dynamic-property-details-page";
import { DynamicMarketingTemplatePage } from "@/features/cms/dynamic-marketing-template-page";
import {
  getNotFoundTemplate,
  getTemplatePageBySlug,
  type TemplatePageEntry,
  type TemplatePageModule,
} from "@/generated/template-registry";
import type { CmsConfigPayload, CmsPageConfig } from "@/lib/cms-api";
import type { SeoMetadata } from "@/lib/seo-metadata";
import { defaultDescription, siteName } from "@/lib/site-config";

export type ResolvedTemplatePage = {
  moduleLoader: () => Promise<TemplatePageModule>;
  routePath: string;
  usesCmsProvider: boolean;
  isNotFound: boolean;
  seoOverride?: Partial<SeoMetadata>;
  contentOverride?: Record<string, unknown>;
};

export const fallbackNotFoundMetadata: SeoMetadata = {
  title: "404 | Home Real Estate",
  description: "The requested page could not be found.",
  robots: {
    index: false,
    follow: false,
  },
};

const listListingTemplateNumbers = new Set([2, 4, 6, 8, 10, 12, 15, 17]);

function toRoutePath(slug: string[]) {
  if (slug.length === 0) {
    return "/";
  }

  return `/${slug.join("/")}`;
}

function normalizeSlug(slug: string[]) {
  return slug
    .filter(Boolean)
    .map((segment) => segment.trim().replace(/^\/+|\/+$/g, "").toLowerCase())
    .filter(Boolean);
}

function normalizeSlugPath(slugPath: string) {
  return slugPath.trim().replace(/^\/+|\/+$/g, "").toLowerCase();
}

function isBlockedPublicSlug(slug: string[]) {
  const firstSegment = slug[0];

  return firstSegment === "dashboard"
    || firstSegment === "admin"
    || firstSegment === "portal"
    || firstSegment === "login";
}

function isListingCollectionTemplateKey(templateKey: string) {
  return templateKey === "listing_dynamic" || /^listing_\d+$/i.test(templateKey);
}

function isBlogCollectionTemplateKey(templateKey: string) {
  return templateKey === "blog_dynamic" || /^blog_\d+$/i.test(templateKey);
}

function isAgentCollectionTemplateKey(templateKey: string) {
  return templateKey === "agent";
}

function isMarketingTemplateKey(templateKey: string) {
  return /^about_us_\d+$/i.test(templateKey)
    || templateKey === "contact"
    || templateKey === "faq"
    || /^pricing_\d+$/i.test(templateKey)
    || /^project_\d+$/i.test(templateKey)
    || /^project_details_\d+$/i.test(templateKey)
    || /^service_\d+$/i.test(templateKey)
    || templateKey === "service_details"
    || templateKey === "agency"
    || templateKey === "agency_details";
}

function listingTemplateNumber(templateKey: string): number | null {
  const match = /^listing_(\d+)$/i.exec(templateKey);
  if (!match) {
    return null;
  }

  const number = Number.parseInt(match[1], 10);
  return Number.isFinite(number) ? number : null;
}

function toListingDetailsTemplateKey(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return /^listing_details_\d+$/i.test(normalized) ? normalized : null;
}

function resolveListingDetailsTemplateKey(
  listingTemplateKey: string,
  pageContent?: Record<string, unknown>,
): string {
  const explicitTemplateKey = toListingDetailsTemplateKey(pageContent?.details_template_key);

  if (explicitTemplateKey) {
    return explicitTemplateKey;
  }

  const templateNumber = listingTemplateNumber(listingTemplateKey);

  if (templateNumber !== null) {
    const detailTemplate = listListingTemplateNumbers.has(templateNumber)
      ? "listing_details_02"
      : "listing_details_01";

    return detailTemplate;
  }

  return "listing_details_01";
}

function buildHome01Page(
  routePath = "/",
  seoOverride?: Partial<SeoMetadata>,
  contentOverride?: Record<string, unknown>,
): ResolvedTemplatePage {
  return {
    moduleLoader: async () => ({
      default: HomePageTemplate,
      metadata: homePageMetadata,
    }),
    routePath,
    usesCmsProvider: true,
    isNotFound: false,
    seoOverride,
    contentOverride,
  };
}

function mapTemplateEntry(
  page: TemplatePageEntry,
  routePath: string,
  options: {
    isNotFound?: boolean;
    usesCmsProvider?: boolean;
    seoOverride?: Partial<SeoMetadata>;
    contentOverride?: Record<string, unknown>;
  } = {},
): ResolvedTemplatePage {
  return {
    moduleLoader: page.moduleLoader,
    routePath,
    usesCmsProvider: options.usesCmsProvider ?? false,
    isNotFound: options.isNotFound ?? false,
    seoOverride: options.seoOverride,
    contentOverride: options.contentOverride,
  };
}

export function resolveHomeTemplateRoute(cmsConfig: CmsConfigPayload): ResolvedTemplatePage {
  const selectedHomeTemplate = cmsConfig.homeTemplate;
  const homeCmsPage = cmsConfig.pages.find((page) => page.pageKey === "home");
  const seoOverride = homeCmsPage ? toSeoOverride(homeCmsPage) : undefined;
  const contentOverride = homeCmsPage?.content;

  if (selectedHomeTemplate && selectedHomeTemplate !== "home_01") {
    const selectedHomePage = getTemplatePageBySlug([selectedHomeTemplate]);

    if (selectedHomePage) {
      return mapTemplateEntry(selectedHomePage, "/", {
        seoOverride,
        contentOverride,
      });
    }
  }

  return buildHome01Page("/", seoOverride, contentOverride);
}

function toSeoOverride(page: CmsPageConfig): Partial<SeoMetadata> | undefined {
  const seo = page.seo;

  if (!seo || typeof seo !== "object") {
    return undefined;
  }

  const result: Partial<SeoMetadata> = {};

  if (typeof seo.title === "string") {
    result.title = seo.title;
  }

  if (typeof seo.description === "string") {
    result.description = seo.description;
  }

  if (Array.isArray(seo.keywords)) {
    result.keywords = seo.keywords.filter((keyword): keyword is string => typeof keyword === "string");
  }

  if (seo.robots && typeof seo.robots === "object") {
    result.robots = seo.robots as SeoMetadata["robots"];
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function resolveByTemplateKey(
  templateKey: string,
  routePath: string,
  options: {
    seoOverride?: Partial<SeoMetadata>;
    contentOverride?: Record<string, unknown>;
    pageKey?: string;
    pageTitle?: string | null;
  } = {},
): ResolvedTemplatePage | null {
  if (templateKey === "cms_dynamic") {
    const pageKey = options.pageKey ?? "";
    const pageTitle = options.pageTitle ?? null;

    if (pageKey !== "") {
      return {
        moduleLoader: async () => ({
          default: () => <DynamicCmsPage pageKey={pageKey} pageTitle={pageTitle} />,
          metadata: {
            title: `${siteName} | ${pageTitle ?? "Page"}`,
            description: defaultDescription,
          },
        }),
        routePath,
        usesCmsProvider: false,
        isNotFound: false,
        seoOverride: options.seoOverride,
        contentOverride: options.contentOverride,
      };
    }
  }

  if (isListingCollectionTemplateKey(templateKey)) {
    return {
      moduleLoader: async () => ({
        default: () => (
          <DynamicListingsPage
            routePath={routePath}
            templateKey={templateKey}
            pageTitle={options.pageTitle ?? null}
            pageContent={options.contentOverride}
          />
        ),
        metadata: {
          title: `${siteName} | ${options.pageTitle ?? "Properties"}`,
          description: defaultDescription,
        },
      }),
      routePath,
      usesCmsProvider: false,
      isNotFound: false,
      seoOverride: options.seoOverride,
      contentOverride: options.contentOverride,
    };
  }

  if (isBlogCollectionTemplateKey(templateKey)) {
    return {
      moduleLoader: async () => ({
        default: () => (
          <DynamicBlogPage
            routePath={routePath}
            pageTitle={options.pageTitle ?? null}
            pageContent={options.contentOverride}
          />
        ),
        metadata: {
          title: `${siteName} | ${options.pageTitle ?? "Blog"}`,
          description: defaultDescription,
        },
      }),
      routePath,
      usesCmsProvider: false,
      isNotFound: false,
      seoOverride: options.seoOverride,
      contentOverride: options.contentOverride,
    };
  }

  if (isAgentCollectionTemplateKey(templateKey)) {
    return {
      moduleLoader: async () => ({
        default: () => (
          <DynamicAgentsPage
            routePath={routePath}
            pageTitle={options.pageTitle ?? null}
            pageContent={options.contentOverride}
          />
        ),
        metadata: {
          title: `${siteName} | ${options.pageTitle ?? "Agents"}`,
          description: defaultDescription,
        },
      }),
      routePath,
      usesCmsProvider: false,
      isNotFound: false,
      seoOverride: options.seoOverride,
      contentOverride: options.contentOverride,
    };
  }

  if (isMarketingTemplateKey(templateKey)) {
    return {
      moduleLoader: async () => ({
        default: () => (
          <DynamicMarketingTemplatePage
            routePath={routePath}
            templateKey={templateKey}
            pageTitle={options.pageTitle ?? null}
            pageContent={options.contentOverride}
          />
        ),
        metadata: {
          title: `${siteName} | ${options.pageTitle ?? "Page"}`,
          description: defaultDescription,
        },
      }),
      routePath,
      usesCmsProvider: false,
      isNotFound: false,
      seoOverride: options.seoOverride,
      contentOverride: options.contentOverride,
    };
  }

  if (templateKey === "home_01") {
    return {
      ...buildHome01Page(routePath),
      seoOverride: options.seoOverride,
      contentOverride: options.contentOverride,
    };
  }

  const page = getTemplatePageBySlug([templateKey]);

  if (!page) {
    return null;
  }

  return mapTemplateEntry(page, routePath, {
    seoOverride: options.seoOverride,
    contentOverride: options.contentOverride,
  });
}

function toSlugSegments(slugPath: string) {
  return normalizeSlugPath(slugPath).split("/").filter(Boolean);
}

function findCmsPageBySlug(cmsConfig: CmsConfigPayload, slugPath: string): CmsPageConfig | undefined {
  return cmsConfig.pages.find((page) => {
    if (!page.isActive) {
      return false;
    }

    return normalizeSlugPath(page.slug ?? "") === slugPath;
  });
}

function resolveDynamicEntityDetailRoute(slug: string[], cmsConfig: CmsConfigPayload): ResolvedTemplatePage | null {
  const dynamicPages = cmsConfig.pages.filter((page) => {
    if (!page.isActive || typeof page.slug !== "string" || page.slug.trim() === "") {
      return false;
    }

    return isListingCollectionTemplateKey(page.templateKey)
      || isBlogCollectionTemplateKey(page.templateKey)
      || isAgentCollectionTemplateKey(page.templateKey);
  });

  for (const page of dynamicPages) {
    const pageSlugSegments = toSlugSegments(page.slug);

    if (pageSlugSegments.length === 0) {
      continue;
    }

    if (slug.length !== pageSlugSegments.length + 1) {
      continue;
    }

    const hasMatchingPrefix = pageSlugSegments.every((segment, index) => slug[index] === segment);

    if (!hasMatchingPrefix) {
      continue;
    }

    const detailSlug = slug[slug.length - 1];
    const routePath = toRoutePath(slug);
    const listRoutePath = toRoutePath(pageSlugSegments);

    if (isListingCollectionTemplateKey(page.templateKey)) {
      return {
        moduleLoader: async () => ({
          default: () => (
            <DynamicPropertyDetailsPage
              listRoutePath={listRoutePath}
              propertySlug={detailSlug}
              templateKey={resolveListingDetailsTemplateKey(page.templateKey, page.content)}
              pageContent={page.content}
            />
          ),
          metadata: {
            title: `${siteName} | Property Details`,
            description: defaultDescription,
          },
        }),
        routePath,
        usesCmsProvider: false,
        isNotFound: false,
      };
    }

    if (isBlogCollectionTemplateKey(page.templateKey)) {
      return {
        moduleLoader: async () => ({
          default: () => (
            <DynamicBlogPostPage listRoutePath={listRoutePath} postSlug={detailSlug} />
          ),
          metadata: {
            title: `${siteName} | Blog Details`,
            description: defaultDescription,
          },
        }),
        routePath,
        usesCmsProvider: false,
        isNotFound: false,
      };
    }

    if (isAgentCollectionTemplateKey(page.templateKey)) {
      return {
        moduleLoader: async () => ({
          default: () => (
            <DynamicAgentDetailsPage
              listRoutePath={listRoutePath}
              agentSlug={detailSlug}
              pageContent={page.content}
            />
          ),
          metadata: {
            title: `${siteName} | Agent Profile`,
            description: defaultDescription,
          },
        }),
        routePath,
        usesCmsProvider: false,
        isNotFound: false,
      };
    }
  }

  return null;
}

export function resolveTemplateRouteBySlug(rawSlug: string[], cmsConfig: CmsConfigPayload): ResolvedTemplatePage {
  const slug = normalizeSlug(rawSlug);
  const routePath = toRoutePath(slug);
  if (isBlockedPublicSlug(slug)) {
    const notFoundPage = getNotFoundTemplate();
    if (notFoundPage) {
      return mapTemplateEntry(notFoundPage, routePath, {
        isNotFound: true,
      });
    }

    return {
      moduleLoader: async () => ({
        default: () => <h1>Page not found</h1>,
        metadata: fallbackNotFoundMetadata,
      }),
      routePath,
      usesCmsProvider: false,
      isNotFound: true,
    };
  }

  const slugPath = slug.join("/");
  const cmsPage = findCmsPageBySlug(cmsConfig, slugPath);

  if (cmsPage) {
    const resolvedByCms = resolveByTemplateKey(cmsPage.templateKey, routePath, {
      seoOverride: toSeoOverride(cmsPage),
      contentOverride: cmsPage.content,
      pageKey: cmsPage.pageKey,
      pageTitle: cmsPage.title,
    });

    if (resolvedByCms) {
      return resolvedByCms;
    }
  }

  const dynamicEntityDetailPage = resolveDynamicEntityDetailRoute(slug, cmsConfig);

  if (dynamicEntityDetailPage) {
    return dynamicEntityDetailPage;
  }

  const resolvedByTemplateSlug = resolveByTemplateKey(slug.join("/"), routePath);
  if (resolvedByTemplateSlug) {
    return resolvedByTemplateSlug;
  }

  const page = getTemplatePageBySlug(slug);

  if (page) {
    return mapTemplateEntry(page, routePath);
  }

  const notFoundPage = getNotFoundTemplate();
  if (notFoundPage) {
    return mapTemplateEntry(notFoundPage, routePath, {
      isNotFound: true,
    });
  }

  return {
    moduleLoader: async () => ({
      default: () => <h1>Page not found</h1>,
      metadata: fallbackNotFoundMetadata,
    }),
    routePath,
    usesCmsProvider: false,
    isNotFound: true,
  };
}

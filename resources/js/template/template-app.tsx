import {
  type ComponentType,
  useEffect,
  useMemo,
  useState,
} from "react";
import { HomePageTemplate, homePageMetadata } from "@/features/home/home-page";
import {
  getNotFoundTemplate,
  getTemplatePageBySlug,
  type TemplatePageModule,
} from "@/generated/template-registry";
import { getActiveHomeTemplateKey } from "@/lib/app-config";
import type { SeoMetadata } from "@/lib/seo-metadata";
import { withSeoDefaults } from "@/lib/seo";

type ResolvedPage = {
  moduleLoader: () => Promise<TemplatePageModule>;
  routePath: string;
};

function normalizePathname(pathname: string): string {
  if (!pathname) {
    return "/";
  }

  if (pathname === "/") {
    return "/";
  }

  return `/${pathname.replace(/^\/+|\/+$/g, "")}`;
}

function resolveTemplatePage(pathname: string): ResolvedPage {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === "/") {
    const activeHomeTemplate = getActiveHomeTemplateKey();

    if (activeHomeTemplate !== "home_01") {
      const selectedHomeTemplate = getTemplatePageBySlug([activeHomeTemplate]);

      if (selectedHomeTemplate) {
        return {
          moduleLoader: selectedHomeTemplate.moduleLoader,
          routePath: "/",
        };
      }
    }

    return {
      moduleLoader: async () => ({
        default: HomePageTemplate,
        metadata: homePageMetadata,
      }),
      routePath: "/",
    };
  }

  const slug = normalizedPathname.replace(/^\//, "").split("/");
  const page = getTemplatePageBySlug(slug);

  if (page) {
    return page;
  }

  const notFoundPage = getNotFoundTemplate();
  if (notFoundPage) {
    return {
      moduleLoader: notFoundPage.moduleLoader,
      routePath: normalizedPathname,
    };
  }

  return {
    moduleLoader: async () => ({
      default: () => <h1>Page not found</h1>,
      metadata: {
        title: "404 | Home Real Estate",
        description: "The requested page could not be found.",
      },
    }),
    routePath: normalizedPathname,
  };
}

function upsertMetaByName(name: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);

  if (!tag) {
    tag = document.createElement("meta");
    tag.name = name;
    document.head.appendChild(tag);
  }

  tag.content = content;
}

function upsertCanonicalLink(href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!tag) {
    tag = document.createElement("link");
    tag.rel = "canonical";
    document.head.appendChild(tag);
  }

  tag.href = href;
}

function updateDocumentMetadata(metadata: SeoMetadata, routePath: string) {
  const title = typeof metadata.title === "string"
    ? metadata.title
    : metadata.title?.absolute;

  if (title) {
    document.title = title;
  }

  const description = metadata.description;
  if (description) {
    upsertMetaByName("description", description);
  }

  if (metadata.keywords?.length) {
    upsertMetaByName("keywords", metadata.keywords.join(", "));
  }

  const robots = metadata.robots;
  if (robots) {
    const robotsContent = `${robots.index === false ? "noindex" : "index"},${robots.follow === false ? "nofollow" : "follow"}`;
    upsertMetaByName("robots", robotsContent);
  }

  const canonicalPath = metadata.alternates?.canonical ?? routePath;
  upsertCanonicalLink(new URL(canonicalPath, window.location.origin).toString());
}

export function TemplateApp() {
  const resolvedPage = useMemo(
    () => resolveTemplatePage(window.location.pathname),
    [],
  );
  const [pageModule, setPageModule] = useState<TemplatePageModule | null>(null);

  useEffect(() => {
    let isCancelled = false;

    resolvedPage.moduleLoader()
      .then((loadedModule) => {
        if (isCancelled) {
          return;
        }

        setPageModule(loadedModule);

        const metadata = withSeoDefaults(loadedModule.metadata, resolvedPage.routePath);
        updateDocumentMetadata(metadata, resolvedPage.routePath);
      })
      .catch(() => {
        if (!isCancelled) {
          const fallbackModule: TemplatePageModule = {
            default: () => <h1>Page not found</h1>,
            metadata: {
              title: "404 | Home Real Estate",
              description: "The requested page could not be found.",
            },
          };

          setPageModule(fallbackModule);
          updateDocumentMetadata(fallbackModule.metadata, resolvedPage.routePath);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [resolvedPage.moduleLoader, resolvedPage.routePath]);

  const PageComponent = useMemo<ComponentType | null>(
    () => pageModule?.default ?? null,
    [pageModule],
  );

  if (!PageComponent) {
    return null;
  }

  return <PageComponent />;
}

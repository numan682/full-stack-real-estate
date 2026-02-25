import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTemplateStaticParams } from "@/generated/template-registry";
import { fetchCmsConfig } from "@/lib/cms-api";
import { CmsConfigProvider } from "@/lib/cms-context";
import { TemplateCmsFrame } from "@/components/template-cms-frame";
import { toNextMetadata } from "@/lib/next-metadata";
import { withSeoDefaults } from "@/lib/seo";
import {
  fallbackNotFoundMetadata,
  resolveTemplateRouteBySlug,
} from "@/lib/template-page-resolver";

type SlugPageProps = {
  params: Promise<{
    slug: string[];
  }>;
};

export async function generateStaticParams() {
  return getTemplateStaticParams().filter((param) => {
    const firstSegment = param.slug[0];
    return firstSegment !== "dashboard"
      && firstSegment !== "admin"
      && firstSegment !== "portal"
      && firstSegment !== "login";
  });
}

export async function generateMetadata({ params }: SlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cmsConfig = await fetchCmsConfig();
  const resolvedPage = resolveTemplateRouteBySlug(slug ?? [], cmsConfig);

  try {
    const pageModule = await resolvedPage.moduleLoader();
    return toNextMetadata(
      withSeoDefaults(
        {
          ...pageModule.metadata,
          ...resolvedPage.seoOverride,
        },
        resolvedPage.routePath,
      ),
    );
  } catch {
    return toNextMetadata(withSeoDefaults(fallbackNotFoundMetadata, resolvedPage.routePath));
  }
}

export default async function SlugPage({ params }: SlugPageProps) {
  const { slug } = await params;
  const cmsConfig = await fetchCmsConfig();
  const resolvedPage = resolveTemplateRouteBySlug(slug ?? [], cmsConfig);

  if (resolvedPage.isNotFound) {
    notFound();
  }

  const pageModule = await resolvedPage.moduleLoader();
  const PageComponent = pageModule.default;

  if (resolvedPage.usesCmsProvider) {
    return (
      <CmsConfigProvider value={cmsConfig}>
        <PageComponent />
      </CmsConfigProvider>
    );
  }

  return (
    <TemplateCmsFrame cmsConfig={cmsConfig} contentOverrides={resolvedPage.contentOverride}>
      <PageComponent />
    </TemplateCmsFrame>
  );
}

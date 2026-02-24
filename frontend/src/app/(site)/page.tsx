import type { Metadata } from "next";
import { CmsConfigProvider } from "@/lib/cms-context";
import { fetchCmsConfig } from "@/lib/cms-api";
import { TemplateCmsFrame } from "@/components/template-cms-frame";
import { toNextMetadata } from "@/lib/next-metadata";
import { withSeoDefaults } from "@/lib/seo";
import {
  fallbackNotFoundMetadata,
  resolveHomeTemplateRoute,
} from "@/lib/template-page-resolver";

export async function generateMetadata(): Promise<Metadata> {
  const cmsConfig = await fetchCmsConfig();
  const resolvedPage = resolveHomeTemplateRoute(cmsConfig);

  try {
    const pageModule = await resolvedPage.moduleLoader();
    return toNextMetadata(withSeoDefaults(pageModule.metadata, resolvedPage.routePath));
  } catch {
    return toNextMetadata(withSeoDefaults(fallbackNotFoundMetadata, "/"));
  }
}

export default async function HomePage() {
  const cmsConfig = await fetchCmsConfig();
  const resolvedPage = resolveHomeTemplateRoute(cmsConfig);
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
    <TemplateCmsFrame cmsConfig={cmsConfig}>
      <PageComponent />
    </TemplateCmsFrame>
  );
}

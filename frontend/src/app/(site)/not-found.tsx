import type { Metadata } from "next";
import { getNotFoundTemplate } from "@/generated/template-registry";
import { toNextMetadata } from "@/lib/next-metadata";
import { withSeoDefaults } from "@/lib/seo";
import { fallbackNotFoundMetadata } from "@/lib/template-page-resolver";

export const metadata: Metadata = toNextMetadata(
  withSeoDefaults(fallbackNotFoundMetadata, "/404"),
);

export default async function NotFoundPage() {
  const notFoundPage = getNotFoundTemplate();

  if (!notFoundPage) {
    return <h1>Page not found</h1>;
  }

  try {
    const pageModule = await notFoundPage.moduleLoader();
    const PageComponent = pageModule.default;

    return <PageComponent />;
  } catch {
    return <h1>Page not found</h1>;
  }
}

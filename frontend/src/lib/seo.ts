import { defaultDescription, siteName } from "@/lib/site-config";
import type { SeoMetadata } from "@/lib/seo-metadata";

function normalizeTitle(title: SeoMetadata["title"]) {
  if (typeof title === "string") {
    return title;
  }

  if (title && typeof title === "object" && typeof title.absolute === "string") {
    return title.absolute;
  }

  return siteName;
}

export function withSeoDefaults(metadata: SeoMetadata, routePath: string): SeoMetadata {
  const title = normalizeTitle(metadata.title);
  const description = metadata.description ?? defaultDescription;

  return {
    ...metadata,
    description,
    alternates: {
      ...metadata.alternates,
      canonical: routePath
    },
    openGraph: {
      type: "website",
      ...metadata.openGraph,
      title,
      description,
      url: routePath,
      siteName
    },
    twitter: {
      card: "summary_large_image",
      ...metadata.twitter,
      title,
      description
    }
  };
}

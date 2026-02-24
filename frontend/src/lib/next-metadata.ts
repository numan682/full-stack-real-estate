import type { Metadata } from "next";
import type { SeoMetadata } from "@/lib/seo-metadata";

function normalizeTitle(title: SeoMetadata["title"]): string | undefined {
  if (typeof title === "string") {
    return title;
  }

  if (title && typeof title === "object" && typeof title.absolute === "string") {
    return title.absolute;
  }

  return undefined;
}

export function toNextMetadata(metadata: SeoMetadata): Metadata {
  const title = normalizeTitle(metadata.title);
  const nextMetadata: Metadata = {};

  if (title) {
    nextMetadata.title = title;
  }

  if (metadata.description) {
    nextMetadata.description = metadata.description;
  }

  if (metadata.keywords?.length) {
    nextMetadata.keywords = metadata.keywords;
  }

  if (metadata.alternates?.canonical) {
    nextMetadata.alternates = {
      canonical: metadata.alternates.canonical,
    };
  }

  if (metadata.robots) {
    nextMetadata.robots = {
      index: metadata.robots.index,
      follow: metadata.robots.follow,
    };
  }

  if (metadata.openGraph) {
    nextMetadata.openGraph = {
      title: metadata.openGraph.title,
      description: metadata.openGraph.description,
      url: metadata.openGraph.url,
      siteName: metadata.openGraph.siteName,
      locale: metadata.openGraph.locale,
    };
  }

  if (metadata.twitter) {
    const twitterCard = metadata.twitter.card;
    const normalizedCard = twitterCard === "summary"
      || twitterCard === "summary_large_image"
      || twitterCard === "player"
      || twitterCard === "app"
      ? twitterCard
      : undefined;

    nextMetadata.twitter = {
      card: normalizedCard,
      title: metadata.twitter.title,
      description: metadata.twitter.description,
    };
  }

  return nextMetadata;
}

export type SeoMetadata = {
  title?: string | { absolute?: string };
  description?: string;
  keywords?: string[];
  alternates?: {
    canonical?: string;
  };
  openGraph?: {
    type?: string;
    locale?: string;
    title?: string;
    description?: string;
    url?: string;
    siteName?: string;
  };
  twitter?: {
    card?: string;
    title?: string;
    description?: string;
  };
  robots?: {
    index?: boolean;
    follow?: boolean;
  };
};

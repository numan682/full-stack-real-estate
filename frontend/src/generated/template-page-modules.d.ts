declare module "@/generated/template-pages/*" {
  import type { ComponentType } from "react";
  import type { SeoMetadata } from "@/lib/seo-metadata";

  const Component: ComponentType;
  export const metadata: SeoMetadata;
  export default Component;
}

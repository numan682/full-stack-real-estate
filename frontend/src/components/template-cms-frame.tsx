import type { ReactNode } from "react";
import type { CmsConfigPayload } from "@/lib/cms-api";
import { CmsConfigProvider } from "@/lib/cms-context";
import { CmsContentOverrides } from "@/components/cms-content-overrides";
import { SiteFooter } from "@/features/shared/site-footer";
import { SiteHeader } from "@/features/shared/site-header";

type TemplateCmsFrameProps = {
  cmsConfig: CmsConfigPayload;
  contentOverrides?: Record<string, unknown>;
  children: ReactNode;
};

export function TemplateCmsFrame({ cmsConfig, contentOverrides, children }: TemplateCmsFrameProps) {
  const globalSettings = cmsConfig.globalSettings ?? {};

  return (
    <CmsConfigProvider value={cmsConfig}>
      <div className="cms-template-frame">
        <SiteHeader
          content={globalSettings.header}
          branding={globalSettings.branding}
          navigation={cmsConfig.navigation}
        />
        <div className="cms-template-static">{children}</div>
        <CmsContentOverrides overrides={contentOverrides} />
        <SiteFooter
          content={globalSettings.footer}
          branding={globalSettings.branding}
          navigation={cmsConfig.navigation}
        />
      </div>
    </CmsConfigProvider>
  );
}

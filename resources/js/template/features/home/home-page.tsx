import { type ComponentType, createElement } from "react";
import { TemplatePageShell } from "@/components/template-page-shell";
import { SiteHeader } from "@/features/shared/site-header";
import { SitePreloader } from "@/features/shared/preloader";
import { HeroBannerOneSection } from "@/features/home/sections/hero-banner-one";
import { FeedbackSectionOne } from "@/features/home/sections/feedback-section-one";
import { BlockFeatureOneSection } from "@/features/home/sections/block-feature-one";
import { BlockFeatureTwoSection } from "@/features/home/sections/block-feature-two";
import { BlockFeatureThreeSection } from "@/features/home/sections/block-feature-three";
import { PropertyListingOneSection } from "@/features/home/sections/property-listing-one";
import { AgentSectionOne } from "@/features/home/sections/agent-section-one";
import { BlockFeatureFourSection } from "@/features/home/sections/block-feature-four";
import { BlockFeatureFiveSection } from "@/features/home/sections/block-feature-five";
import { SiteFooter } from "@/features/shared/site-footer";
import { LoginModal } from "@/features/shared/login-modal";
import { ScrollTopButton } from "@/features/shared/scroll-top";
import { defaultDescription, siteName } from "@/lib/site-config";
import type { SeoMetadata } from "@/lib/seo-metadata";
import { getGlobalSettings, getHomeSections } from "@/lib/app-config";
import { withSeoDefaults } from "@/lib/seo";

export const homePageMetadata: SeoMetadata = withSeoDefaults({
  title: `${siteName} | Buy, Rent & Sell Property`,
  description: defaultDescription,
  keywords: ["Real estate", "Property sale", "Property buy"]
}, "/");

export const homePageScripts = [
  "/vendor/jquery.min.js",
  "/vendor/bootstrap/js/bootstrap.bundle.min.js",
  "/vendor/wow/wow.min.js",
  "/vendor/slick/slick.min.js",
  "/vendor/fancybox/fancybox.umd.js",
  "/vendor/jquery.lazy.min.js",
  "/vendor/jquery.counterup.min.js",
  "/vendor/jquery.waypoints.min.js",
  "/vendor/nice-select/jquery.nice-select.min.js",
  "/vendor/validator.js",
  "/js/theme.js"
];

const homeSectionRegistry: Record<string, ComponentType> = {
  hero_banner_one: HeroBannerOneSection,
  feedback_section_one: FeedbackSectionOne,
  block_feature_one: BlockFeatureOneSection,
  block_feature_two: BlockFeatureTwoSection,
  block_feature_three: BlockFeatureThreeSection,
  property_listing_one: PropertyListingOneSection,
  agent_section_one: AgentSectionOne,
  block_feature_four: BlockFeatureFourSection,
  block_feature_five: BlockFeatureFiveSection,
};

const defaultHomeSections = [
  { sectionKey: "hero_banner_one", sortOrder: 10, isEnabled: true, payload: {} },
  { sectionKey: "feedback_section_one", sortOrder: 20, isEnabled: true, payload: {} },
  { sectionKey: "block_feature_one", sortOrder: 30, isEnabled: true, payload: {} },
  { sectionKey: "block_feature_two", sortOrder: 40, isEnabled: true, payload: {} },
  { sectionKey: "block_feature_three", sortOrder: 50, isEnabled: true, payload: {} },
  { sectionKey: "property_listing_one", sortOrder: 60, isEnabled: true, payload: {} },
  { sectionKey: "agent_section_one", sortOrder: 70, isEnabled: true, payload: {} },
  { sectionKey: "block_feature_four", sortOrder: 80, isEnabled: true, payload: {} },
  { sectionKey: "block_feature_five", sortOrder: 90, isEnabled: true, payload: {} },
];

export function HomePageTemplate() {
  const globalSettings = getGlobalSettings();
  const configuredSections = getHomeSections();
  const sections = (configuredSections.length > 0 ? configuredSections : defaultHomeSections)
    .filter((section) => homeSectionRegistry[section.sectionKey])
    .sort((first, second) => first.sortOrder - second.sortOrder);

  return (
    <TemplatePageShell scripts={homePageScripts}>
      <div className="main-page-wrapper">
        <SitePreloader />
        <SiteHeader content={globalSettings.header} />
        {sections
          .filter((section) => section.isEnabled)
          .map((section) => {
            const SectionComponent = homeSectionRegistry[section.sectionKey] as ComponentType<{ content?: Record<string, unknown> }>;

            return createElement(SectionComponent, {
              key: section.sectionKey,
              content: section.payload,
            });
          })}
        <SiteFooter content={globalSettings.footer} />
        <LoginModal />
        <ScrollTopButton />
      </div>
    </TemplatePageShell>
  );
}

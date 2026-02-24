"use client";

import type { ComponentType } from "react";
import { TemplatePageShell } from "@/components/template-page-shell";
import { cmsThemeScripts } from "@/features/cms/cms-theme-scripts";
import { LoginModal } from "@/features/shared/login-modal";
import { ScrollTopButton } from "@/features/shared/scroll-top";
import type { CmsSectionConfig } from "@/lib/cms-api";
import { useCmsConfig } from "@/lib/cms-context";

type DynamicPageProps = {
  pageKey: string;
  pageTitle?: string | null;
};

type SectionPayload = Record<string, unknown>;
type SectionComponentProps = {
  payload?: SectionPayload;
  sectionKey: string;
  index: number;
};

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

function toArrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function HeroBannerSection({ payload }: SectionComponentProps) {
  const title = toStringValue(payload?.title, "Page Title");
  const subtitle = toStringValue(payload?.subtitle, "");
  const buttonLabel = toStringValue(payload?.button_label, "");
  const buttonLink = toStringValue(payload?.button_link, "#");

  return (
    <section className="inner-banner-one inner-banner bg-pink text-center z-1 pt-160 lg-pt-130 pb-110 xl-pb-80 md-pb-60 position-relative">
      <div className="container">
        <h3 className="mb-20 xl-mb-15 pt-15">{title}</h3>
        {subtitle !== "" ? <p className="fs-22">{subtitle}</p> : null}
        {buttonLabel !== "" ? (
          <div className="mt-25">
            <a href={buttonLink} className="btn-two">
              {buttonLabel}
            </a>
          </div>
        ) : null}
      </div>
      <img src="/images/lazy.svg" data-src="/images/assets/ils_07.svg" alt="" className="lazy-img shapes w-100 illustration" />
    </section>
  );
}

function RichTextSection({ payload }: SectionComponentProps) {
  const title = toStringValue(payload?.title, "Section");
  const content = toStringValue(payload?.content, "");

  return (
    <section className="block-feature-two mt-120 xl-mt-90">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-9">
            <div className="title-one mb-30">
              <h3>{title}</h3>
            </div>
            <p className="fs-22 lh-lg">{content}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ImageTextSection({ payload }: SectionComponentProps) {
  const title = toStringValue(payload?.title, "Section title");
  const content = toStringValue(payload?.content, "");
  const image = toStringValue(payload?.image, "/images/media/img_50.jpg");
  const buttonLabel = toStringValue(payload?.button_label, "");
  const buttonLink = toStringValue(payload?.button_link, "#");

  return (
    <section className="block-feature-two mt-120 xl-mt-90">
      <div className="container">
        <div className="row gx-xl-5 align-items-center">
          <div className="col-lg-6">
            <img src={image} alt={title} className="w-100 border-20" />
          </div>
          <div className="col-lg-6">
            <div className="mt-30 mt-lg-0">
              <div className="title-one mb-30">
                <h3>{title}</h3>
              </div>
              <p className="fs-22 lh-lg">{content}</p>
              {buttonLabel !== "" ? (
                <a href={buttonLink} className="btn-two mt-25">
                  {buttonLabel}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsSection({ payload }: SectionComponentProps) {
  const title = toStringValue(payload?.title, "Our Numbers");
  const items = toArrayValue(payload?.items)
    .map((item) => (item && typeof item === "object" ? item as Record<string, unknown> : null))
    .filter((item): item is Record<string, unknown> => item !== null);

  return (
    <section className="block-feature-five position-relative z-1 pt-130 xl-pt-100 pb-80 xl-pb-60">
      <div className="container">
        <div className="title-one text-center mb-40">
          <h3>{title}</h3>
        </div>
        <div className="row justify-content-center">
          {items.map((item, index) => (
            <div className="col-lg-4 col-sm-6" key={`stat-${index}`}>
              <div className="card-style-one text-center wow fadeInUp mt-30">
                <h3>{toStringValue(item.value, "0")}</h3>
                <p>{toStringValue(item.label, "Metric")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection({ payload, sectionKey }: SectionComponentProps) {
  const title = toStringValue(payload?.title, "Frequently Asked Questions");
  const items = toArrayValue(payload?.items)
    .map((item) => (item && typeof item === "object" ? item as Record<string, unknown> : null))
    .filter((item): item is Record<string, unknown> => item !== null);
  const accordionId = `accordion-${sectionKey}`;

  return (
    <section className="faq-section-one position-relative z-1 mt-130 xl-mt-100">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-9">
            <div className="title-one text-center mb-35">
              <h3>{title}</h3>
            </div>
            <div className="accordion-style-two">
              <div className="accordion" id={accordionId}>
                {items.map((item, index) => {
                  const collapseId = `${accordionId}-item-${index}`;
                  const isFirst = index === 0;

                  return (
                    <div className="accordion-item" key={collapseId}>
                      <h2 className="accordion-header">
                        <button
                          className={`accordion-button ${isFirst ? "" : "collapsed"}`}
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={`#${collapseId}`}
                          aria-expanded={isFirst ? "true" : "false"}
                          aria-controls={collapseId}
                        >
                          {toStringValue(item.question, "Question")}
                        </button>
                      </h2>
                      <div
                        id={collapseId}
                        className={`accordion-collapse collapse ${isFirst ? "show" : ""}`}
                        data-bs-parent={`#${accordionId}`}
                      >
                        <div className="accordion-body">
                          <p>{toStringValue(item.answer, "")}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaSection({ payload }: SectionComponentProps) {
  const title = toStringValue(payload?.title, "Ready to get started?");
  const buttonLabel = toStringValue(payload?.button_label, "Contact");
  const buttonLink = toStringValue(payload?.button_link, "/contact");

  return (
    <section className="fancy-banner-two position-relative z-1 pt-90 lg-pt-60 pb-90 lg-pb-60 mt-120 xl-mt-100">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-8 m-auto text-center">
            <div className="title-one mb-30">
              <h3 className="text-white m0">{title}</h3>
            </div>
            <a href={buttonLink} className="btn-nine text-uppercase">
              <span>{buttonLabel}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

const sectionRegistry: Record<string, ComponentType<SectionComponentProps>> = {
  hero_banner: HeroBannerSection,
  rich_text: RichTextSection,
  image_text: ImageTextSection,
  stats: StatsSection,
  faq: FaqSection,
  cta: CtaSection,
};

function normalizeSections(rawSections: CmsSectionConfig[]) {
  return [...rawSections]
    .filter((section) => sectionRegistry[section.sectionKey])
    .sort((first, second) => first.sortOrder - second.sortOrder);
}

export function DynamicCmsPage({ pageKey, pageTitle }: DynamicPageProps) {
  const cmsConfig = useCmsConfig();
  const rawSections = cmsConfig.pageSections?.[pageKey] ?? [];
  const sections = normalizeSections(rawSections);
  const fallbackTitle = pageTitle ?? "Dynamic Page";

  return (
    <TemplatePageShell scripts={cmsThemeScripts}>
      <div className="main-page-wrapper">
        {sections.length === 0 ? (
          <section className="inner-banner-one inner-banner bg-pink text-center z-1 pt-160 lg-pt-130 pb-110 xl-pb-80 md-pb-60 position-relative">
            <div className="container">
              <h3 className="mb-20 xl-mb-15 pt-15">{fallbackTitle}</h3>
              <p className="fs-22">No sections configured for this page. Add sections in Admin CMS.</p>
            </div>
          </section>
        ) : (
          sections
            .filter((section) => section.isEnabled)
            .map((section, index) => {
              const SectionComponent = sectionRegistry[section.sectionKey];

              return (
                <SectionComponent
                  key={`${section.sectionKey}-${index}`}
                  sectionKey={section.sectionKey}
                  index={index}
                  payload={section.payload}
                />
              );
            })
        )}

        <LoginModal />
        <ScrollTopButton />
      </div>
    </TemplatePageShell>
  );
}

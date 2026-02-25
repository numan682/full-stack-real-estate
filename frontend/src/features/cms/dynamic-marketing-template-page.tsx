import Link from "next/link";
import { notFound } from "next/navigation";
import { TemplatePageShell } from "@/components/template-page-shell";
import { ContactInquiryForm } from "@/features/cms/contact-inquiry-form";
import { PricingPlanSwitcher, type PricingPlan } from "@/features/cms/pricing-plan-switcher";
import { cmsThemeScripts } from "@/features/cms/cms-theme-scripts";
import { LoginModal } from "@/features/shared/login-modal";
import { ScrollTopButton } from "@/features/shared/scroll-top";
import {
  fetchPublicAgents,
  fetchPublicProperties,
  fetchPublicProperty,
  type PublicAgent,
  type PublicProperty,
} from "@/lib/public-api";

type DynamicMarketingTemplatePageProps = {
  routePath: string;
  templateKey: string;
  pageTitle?: string | null;
  pageContent?: Record<string, unknown>;
};

type MarketingTemplateFamily =
  | "about"
  | "contact"
  | "faq"
  | "pricing"
  | "project"
  | "service"
  | "agency"
  | "unknown";

type MarketingShellProps = {
  children: React.ReactNode;
};

type SimpleCard = {
  title: string;
  description: string;
  buttonLabel: string;
  buttonLink: string;
  icon: string;
};

type Testimonial = {
  quote: string;
  name: string;
  location: string;
  avatar: string;
};

type FaqGroup = {
  title: string;
  items: Array<{
    question: string;
    answer: string;
  }>;
};

type AgencySummary = {
  slug: string;
  name: string;
  city: string;
  state: string;
  country: string;
  email: string;
  phone: string;
  website: string;
  listingCount: number;
  agents: PublicAgent[];
  properties: PublicProperty[];
};

function toStringValue(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim() !== "") {
    return value.trim();
  }

  return fallback;
}

function toIntegerValue(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function toRecordArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (item && typeof item === "object" && !Array.isArray(item) ? item as Record<string, unknown> : null))
    .filter((item): item is Record<string, unknown> => item !== null);
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item !== "");
}

function toTitleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .map((word) => (word.length > 0 ? `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}` : ""))
    .join(" ")
    .trim();
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatPrice(rawPrice: string | number) {
  const price = typeof rawPrice === "number" ? rawPrice : Number.parseFloat(rawPrice);

  if (!Number.isFinite(price)) {
    return String(rawPrice);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(value?: string | null, fallback = "Recent") {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function propertyImage(property: PublicProperty) {
  if (property.primary_image?.path && property.primary_image.path.trim() !== "") {
    return property.primary_image.path;
  }

  if (Array.isArray(property.images) && property.images[0]?.path) {
    return property.images[0].path;
  }

  return "/images/project/img_01.jpg";
}

function propertyAlt(property: PublicProperty) {
  return property.primary_image?.alt_text ?? property.title;
}

function propertyAddress(property: PublicProperty) {
  return [property.address_line, property.city, property.state, property.country]
    .filter((entry): entry is string => typeof entry === "string" && entry.trim() !== "")
    .join(", ");
}

function propertyDetailsPath(basePath: string, slug: string) {
  const normalizedBase = basePath.trim();
  const prefix = normalizedBase === "" ? "/properties" : normalizedBase;
  const withoutTrailingSlash = prefix.replace(/\/+$/, "");

  return `${withoutTrailingSlash}/${slug}`;
}

function resolveMarketingTemplateFamily(templateKey: string): MarketingTemplateFamily {
  const normalized = templateKey.toLowerCase();

  if (normalized.startsWith("about_us_")) {
    return "about";
  }

  if (normalized === "contact") {
    return "contact";
  }

  if (normalized === "faq") {
    return "faq";
  }

  if (normalized.startsWith("pricing_")) {
    return "pricing";
  }

  if (normalized.startsWith("project_")) {
    return "project";
  }

  if (normalized.startsWith("service_")) {
    return "service";
  }

  if (normalized === "agency" || normalized === "agency_details") {
    return "agency";
  }

  return "unknown";
}

function parseSimpleCards(
  value: unknown,
  fallback: SimpleCard[],
): SimpleCard[] {
  const rows = toRecordArray(value);
  if (rows.length === 0) {
    return fallback;
  }

  const parsed = rows.map((row, index) => ({
    title: toStringValue(row.title, `Card ${index + 1}`),
    description: toStringValue(row.description, ""),
    buttonLabel: toStringValue(row.button_label, "Learn More"),
    buttonLink: toStringValue(row.button_link, "/contact"),
    icon: toStringValue(row.icon, fallback[index % fallback.length]?.icon ?? "/images/icon/icon_23.svg"),
  }));

  return parsed;
}

function parseTestimonials(value: unknown, fallback: Testimonial[]): Testimonial[] {
  const rows = toRecordArray(value);
  if (rows.length === 0) {
    return fallback;
  }

  return rows.map((row, index) => ({
    quote: toStringValue(row.quote, fallback[index % fallback.length]?.quote ?? "Great experience."),
    name: toStringValue(row.name, fallback[index % fallback.length]?.name ?? "Happy Client"),
    location: toStringValue(row.location, fallback[index % fallback.length]?.location ?? "United States"),
    avatar: toStringValue(row.avatar, fallback[index % fallback.length]?.avatar ?? "/images/media/img_01.jpg"),
  }));
}

function parseFaqGroups(value: unknown, fallback: FaqGroup[]): FaqGroup[] {
  const rows = toRecordArray(value);
  if (rows.length === 0) {
    return fallback;
  }

  const parsed = rows
    .map((row, groupIndex) => {
      const items = toRecordArray(row.items)
        .map((item, itemIndex) => ({
          question: toStringValue(item.question, `Question ${itemIndex + 1}`),
          answer: toStringValue(item.answer, "Answer will be updated by admin."),
        }));

      if (items.length === 0) {
        return null;
      }

      return {
        title: toStringValue(row.title, `Section ${groupIndex + 1}`),
        items,
      };
    })
    .filter((group): group is FaqGroup => group !== null);

  return parsed.length > 0 ? parsed : fallback;
}

function parsePricingPlans(value: unknown, fallback: PricingPlan[]): PricingPlan[] {
  const rows = toRecordArray(value);
  if (rows.length === 0) {
    return fallback;
  }

  const plans = rows.map((row, index) => {
    const features = toRecordArray(row.features)
      .map((feature, featureIndex) => ({
        label: toStringValue(feature.label, `Feature ${featureIndex + 1}`),
        included: String(feature.included ?? "1") !== "0",
      }));

    return {
      id: toStringValue(row.id, `plan-${index + 1}`),
      name: toStringValue(row.name, `Plan ${index + 1}`),
      description: toStringValue(row.description, ""),
      cadenceLabel: toStringValue(row.cadence_label, "per user/month"),
      monthlyPrice: toStringValue(row.monthly_price, "$0"),
      yearlyPrice: toStringValue(row.yearly_price, ""),
      ctaLabel: toStringValue(row.cta_label, "Subscribe Now"),
      ctaLink: toStringValue(row.cta_link, "/contact"),
      highlighted: String(row.highlighted ?? "0") === "1",
      features: features.length > 0
        ? features
        : [
          { label: "Priority support", included: true },
          { label: "Analytics dashboard", included: true },
          { label: "Advanced listings tools", included: false },
        ],
    } satisfies PricingPlan;
  });

  return plans;
}

function buildAgencySummaries(agents: PublicAgent[]): AgencySummary[] {
  const groupMap = new Map<string, AgencySummary>();

  for (const agent of agents) {
    const agency = agent.agency;
    const agencyName = toStringValue(agency?.name, "Independent Team");
    const agencySlugSource = toStringValue(agency?.slug, agencyName);
    const agencySlug = toSlug(agencySlugSource);
    const key = agencySlug === "" ? toSlug(agencyName) : agencySlug;

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        slug: key,
        name: agencyName,
        city: toStringValue(agency?.city, ""),
        state: toStringValue(agency?.state, ""),
        country: toStringValue(agency?.country, ""),
        email: toStringValue(agency?.email, ""),
        phone: toStringValue(agency?.phone, ""),
        website: toStringValue(agency?.website, ""),
        listingCount: 0,
        agents: [],
        properties: [],
      });
    }

    const group = groupMap.get(key);
    if (!group) {
      continue;
    }

    group.agents.push(agent);
    const publishedCount = agent.published_properties_count ?? agent.properties?.length ?? 0;
    group.listingCount += Math.max(publishedCount, 0);

    if (Array.isArray(agent.properties)) {
      for (const property of agent.properties) {
        if (!group.properties.some((entry) => entry.id === property.id)) {
          group.properties.push({
            ...property,
            uuid: String(property.id),
            description: null,
            property_type: "apartment",
            status: "published",
            price: String(property.price),
            listing_type: property.listing_type,
            address_line: property.address_line,
            city: property.city,
            state: property.state,
            postal_code: null,
            country: property.country,
            is_featured: property.is_featured,
          } as PublicProperty);
        }
      }
    }
  }

  return [...groupMap.values()].sort((first, second) => second.listingCount - first.listingCount);
}

function breadcrumbItems(currentLabel: string) {
  return (
    <ul className="theme-breadcrumb style-none d-inline-flex align-items-center justify-content-center position-relative z-1 bottom-line">
      <li><a href="/">Home</a></li>
      <li>/</li>
      <li>{currentLabel}</li>
    </ul>
  );
}

function BannerOne({
  title,
  subtitle,
  illustration = "/images/assets/ils_07.svg",
  currentLabel,
}: {
  title: string;
  subtitle?: string;
  illustration?: string;
  currentLabel: string;
}) {
  return (
    <div className="inner-banner-one inner-banner bg-pink text-center z-1 pt-160 lg-pt-130 pb-160 xl-pb-120 md-pb-80 position-relative">
      <div className="container">
        <h3 className="mb-35 xl-mb-20 pt-15">{title}</h3>
        {breadcrumbItems(currentLabel)}
        {subtitle ? <p className="fs-22 mt-25">{subtitle}</p> : null}
      </div>
      <img src="/images/lazy.svg" data-src={illustration} alt="" className="lazy-img shapes w-100 illustration" />
    </div>
  );
}

function BannerTwo({
  title,
  subtitle,
  backgroundImage = "/images/media/img_49.jpg",
  currentLabel,
}: {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  currentLabel: string;
}) {
  return (
    <div
      className="inner-banner-two inner-banner z-1 pt-160 lg-pt-130 pb-160 xl-pb-120 md-pb-80 position-relative"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="container">
        <div className="row">
          <div className="col-lg-6">
            <h3 className="mb-35 xl-mb-20 pt-15">{title}</h3>
            {breadcrumbItems(currentLabel)}
          </div>
          <div className="col-lg-6">
            {subtitle ? <p className="sub-heading">{subtitle}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function BannerThree({
  title,
  subtitle,
  backgroundImage = "/images/media/img_51.jpg",
  currentLabel,
}: {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  currentLabel: string;
}) {
  return (
    <div className="inner-banner-three inner-banner text-center z-1 position-relative">
      <div className="bg-wrapper overflow-hidden position-relative z-1" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="container position-relative z-2">
          <h2 className="mb-35 xl-mb-20 md-mb-10 pt-15 font-garamond text-white">{title}</h2>
          {breadcrumbItems(currentLabel)}
          {subtitle ? <p className="fs-22 text-white mt-20">{subtitle}</p> : null}
        </div>
        <img src="/images/lazy.svg" data-src="/images/shape/shape_35.svg" alt="" className="lazy-img shapes shape_01" />
        <img src="/images/lazy.svg" data-src="/images/shape/shape_36.svg" alt="" className="lazy-img shapes shape_02" />
      </div>
    </div>
  );
}

function RetailerCta({
  title,
  primaryLabel,
  primaryLink,
  secondaryLabel,
  secondaryLink,
}: {
  title: string;
  primaryLabel: string;
  primaryLink: string;
  secondaryLabel: string;
  secondaryLink: string;
}) {
  return (
    <div className="fancy-banner-eight wow fadeInUp mt-160 xl-mt-100 mb-120 xl-mb-100 lg-mb-80">
      <div className="container container-large">
        <div className="bg-wrapper border-30 bg-pink-two overflow-hidden position-relative z-1">
          <div className="row align-items-end">
            <div className="col-xl-6 col-lg-7 col-md-7">
              <div className="pb-80 lg-pb-40">
                <h3>{title}</h3>
                <div className="d-inline-flex flex-wrap align-items-center position-relative mt-15">
                  <a href={primaryLink} className="btn-eight mt-10 me-4"><span>{primaryLabel}</span></a>
                  <a href={secondaryLink} className="btn-two rounded-0 border-0 mt-10"><span>{secondaryLabel}</span></a>
                </div>
              </div>
            </div>
            <div className="col-xl-6 col-lg-5 col-md-5 text-center text-md-end">
              <div className="media-wrapper position-relative z-1 d-inline-block">
                <img src="/images/lazy.svg" data-src="/images/media/img_44.png" alt="" className="lazy-img" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FooterCta({
  title,
  buttonLabel,
  buttonLink,
}: {
  title: string;
  buttonLabel: string;
  buttonLink: string;
}) {
  return (
    <div className="fancy-banner-two position-relative z-1 pt-90 lg-pt-50 pb-90 lg-pb-50">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-6">
            <div className="title-one text-center text-lg-start md-mb-40 pe-xl-5">
              <h3 className="text-white m0">{title}</h3>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="form-wrapper me-auto ms-auto me-lg-0">
              <a href={buttonLink} className="btn-nine text-uppercase rounded-3 w-100 mb-10">
                {buttonLabel}
              </a>
              <div className="fs-16 mt-10 text-white">
                Already registered? <a href="/login">Sign in.</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketingShell({ children }: MarketingShellProps) {
  return (
    <TemplatePageShell scripts={cmsThemeScripts}>
      <div className="main-page-wrapper">
        {children}
        <LoginModal />
        <ScrollTopButton />
      </div>
    </TemplatePageShell>
  );
}

async function AboutTemplatePage({
  templateKey,
  pageTitle,
  pageContent,
}: DynamicMarketingTemplatePageProps) {
  const [agentsResponse, propertiesResponse] = await Promise.all([
    fetchPublicAgents({ per_page: 8, sort: "name_asc" }),
    fetchPublicProperties({ per_page: 8, sort: "newest" }),
  ]);

  const agents = agentsResponse.data ?? [];
  const propertyTotal = propertiesResponse.meta?.total ?? propertiesResponse.data?.length ?? 0;
  const agentTotal = agentsResponse.meta?.total ?? agents.length;
  const title = toStringValue(pageContent?.hero_title, pageTitle ?? "About Agency");
  const subtitle = toStringValue(pageContent?.hero_subtitle, "Learn more about our team, process, and property expertise.");
  const introTitle = toStringValue(pageContent?.intro_title, "Secure your family's dream home.");
  const introText = toStringValue(
    pageContent?.intro_text,
    "We combine local market knowledge with a modern, transparent buying and selling process.",
  );
  const primaryButtonLabel = toStringValue(pageContent?.primary_button_label, "Contact Us");
  const primaryButtonLink = toStringValue(pageContent?.primary_button_link, "/contact");
  const secondaryButtonLabel = toStringValue(pageContent?.secondary_button_label, "Become an Agent");
  const secondaryButtonLink = toStringValue(pageContent?.secondary_button_link, "/agent");
  const heroBgImage = toStringValue(pageContent?.hero_background, "/images/media/img_51.jpg");
  const videoImage = toStringValue(pageContent?.hero_video_image, "/images/media/img_50.jpg");
  const videoUrl = toStringValue(pageContent?.hero_video_url, "https://www.youtube.com/embed/aXFSJTjVjw0");
  const processCards = parseSimpleCards(pageContent?.process_cards, [
    {
      title: "Create Account",
      description: "Open your account and set your property preferences in minutes.",
      buttonLabel: "Start",
      buttonLink: "/login",
      icon: "/images/icon/icon_07.svg",
    },
    {
      title: "Find Home",
      description: "Browse curated listings and connect directly with active agents.",
      buttonLabel: "Browse",
      buttonLink: "/properties",
      icon: "/images/icon/icon_08.svg",
    },
    {
      title: "Close Quickly",
      description: "Use our guided process for financing, negotiation, and closure.",
      buttonLabel: "Consult",
      buttonLink: "/contact",
      icon: "/images/icon/icon_09.svg",
    },
  ]);
  const aboutServices = parseSimpleCards(pageContent?.about_services, [
    {
      title: "Buy a home",
      description: "Explore verified homes and compare options with confidence.",
      buttonLabel: "Find Home",
      buttonLink: "/properties",
      icon: "/images/icon/icon_23.svg",
    },
    {
      title: "Rent a home",
      description: "Discover rentals using availability and neighborhood filters.",
      buttonLabel: "Rent Home",
      buttonLink: "/properties",
      icon: "/images/icon/icon_24.svg",
    },
    {
      title: "Sell property",
      description: "List with expert support and attract serious buyers faster.",
      buttonLabel: "Sell Property",
      buttonLink: "/portal/agent",
      icon: "/images/icon/icon_25.svg",
    },
  ]);
  const testimonials = parseTestimonials(pageContent?.testimonials, [
    {
      quote: "Efficient and friendly service. We found our ideal home quickly.",
      name: "Musa Delimuza",
      location: "Miami, USA",
      avatar: "/images/media/img_01.jpg",
    },
    {
      quote: "Clear communication, smart recommendations, and smooth negotiation.",
      name: "Alina Cruse",
      location: "Austin, USA",
      avatar: "/images/media/img_02.jpg",
    },
    {
      quote: "Professional team and transparent process from start to finish.",
      name: "Rashed Kabir",
      location: "Chicago, USA",
      avatar: "/images/media/img_03.jpg",
    },
  ]);
  const stats = parseSimpleCards(pageContent?.about_stats, [
    {
      title: `${propertyTotal.toLocaleString("en-US")}+`,
      description: "Published listings",
      buttonLabel: "",
      buttonLink: "#",
      icon: "",
    },
    {
      title: `${agentTotal.toLocaleString("en-US")}+`,
      description: "Active agents",
      buttonLabel: "",
      buttonLink: "#",
      icon: "",
    },
    {
      title: `${toIntegerValue(pageContent?.years_experience, 12)}+`,
      description: "Years experience",
      buttonLabel: "",
      buttonLink: "#",
      icon: "",
    },
  ]);

  const isAlternativeLayout = templateKey.toLowerCase() === "about_us_02";

  if (isAlternativeLayout) {
    return (
      <MarketingShell>
        <BannerThree
          title={title}
          subtitle={subtitle}
          backgroundImage={heroBgImage}
          currentLabel={title}
        />

        <div className="block-feature-fifteen mt-150 xl-mt-100 mb-140 xl-mb-80">
          <div className="container">
            <div className="row gx-xl-5">
              <div className="col-xl-6 col-lg-7 order-lg-last">
                <div className="ms-xxl-5 ps-xl-4 ps-lg-5 md-mb-50">
                  <div className="title-one mb-45 lg-mb-20">
                    <h2 className="font-garamond star-shape">{introTitle}</h2>
                  </div>
                  <div className="accordion-style-three">
                    <div className="accordion" id="aboutAccordionAlt">
                      {processCards.map((card, index) => {
                        const id = `about-alt-${index}`;
                        const isOpen = index === 0;

                        return (
                          <div className="accordion-item" key={id}>
                            <h2 className="accordion-header">
                              <button
                                className={`accordion-button ${isOpen ? "" : "collapsed"}`}
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target={`#${id}`}
                                aria-expanded={isOpen}
                                aria-controls={id}
                              >
                                {card.title}
                              </button>
                            </h2>
                            <div id={id} className={`accordion-collapse collapse ${isOpen ? "show" : ""}`} data-bs-parent="#aboutAccordionAlt">
                              <div className="accordion-body">
                                <p className="fs-22">{card.description}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <a href={primaryButtonLink} className="btn-five mt-75 lg-mt-50">{primaryButtonLabel}</a>
                </div>
              </div>

              <div className="col-xl-6 col-lg-5 d-lg-flex">
                <div className="media-block h-100 w-100 pe-xl-5">
                  <div className="bg-img position-relative" style={{ backgroundImage: `url(${videoImage})` }}>
                    <img src="/images/lazy.svg" data-src="/images/assets/screen_10.png" alt="" className="lazy-img shapes screen_01" />
                  </div>
                </div>
              </div>
            </div>

            <div className="wrapper mt-90 lg-mt-40">
              <div className="row justify-content-center">
                {stats.map((stat, index) => (
                  <div className="col-md-4 col-sm-6" key={`stat-${index}`}>
                    <div className="counter-block-two text-center dark mt-30">
                      <div className="main-count sm font-garamond fw-500">{stat.title}</div>
                      <p className="fs-20 mt-15 md-mt-10">{stat.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="block-feature-sixteen">
          <div className="bg-pink-two position-relative z-1 pt-140 xl-pt-100 lg-pt-80 pb-150 xl-pb-120 lg-pb-100">
            <div className="container">
              <div className="title-one text-center mb-70 xl-mb-40 lg-mb-20">
                <h2 className="font-garamond star-shape">Buy, Rent & Sell</h2>
                <p className="fs-22 mt-xs color-dark">Dynamic service cards driven by CMS content.</p>
              </div>

              <div className="row justify-content-center gx-xxl-5">
                {aboutServices.map((service, index) => (
                  <div className="col-lg-4 col-md-6 mt-30 d-flex wow fadeInUp" data-wow-delay={`${(index % 3) * 0.1}s`} key={`about-service-${index}`}>
                    <div className="card-style-five text-center d-inline-flex flex-column align-items-center tran3s h-100 w-100">
                      <img src="/images/lazy.svg" data-src={service.icon} alt="" className="lazy-img icon" />
                      <h5 className="mt-35 mb-20">{service.title}</h5>
                      <p className="fs-22 mb-50">{service.description}</p>
                      <a href={service.buttonLink} className="btn-twelve mt-auto">{service.buttonLabel}</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="feedback-section-seven mt-170 xl-mt-120 md-mt-80">
          <div className="container container-large">
            <div className="position-relative z-1">
              <div className="row">
                <div className="col-lg-5">
                  <div className="title-one mt-30 md-mb-50 pe-xxl-4">
                    <div className="upper-title">CLIENT FEEDBACK</div>
                    <h3>Rely on clients, not just our claims.</h3>
                  </div>
                </div>
                <div className="col-lg-7">
                  <div className="content-wrapper position-relative z-1 ms-xxl-3">
                    <div className="feedback-slider-one">
                      {testimonials.map((testimonial, index) => (
                        <div className="item" key={`feedback-alt-${index}`}>
                          <div className="feedback-block-five">
                            <blockquote>{testimonial.quote}</blockquote>
                            <div className="d-flex align-items-center justify-content-end ct-info">
                              <img src={testimonial.avatar} alt={testimonial.name} className="rounded-circle avatar" />
                              <div className="ps-3">
                                <h6 className="fs-20 m0">{testimonial.name}</h6>
                                <span className="fs-16 opacity-50">{testimonial.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <RetailerCta
          title={toStringValue(pageContent?.cta_title, "Start your journey as a retailer.")}
          primaryLabel={secondaryButtonLabel}
          primaryLink={secondaryButtonLink}
          secondaryLabel={primaryButtonLabel}
          secondaryLink={primaryButtonLink}
        />
      </MarketingShell>
    );
  }

  return (
    <MarketingShell>
      <BannerOne
        title={title}
        subtitle={subtitle}
        currentLabel={title}
      />

      <div className="block-feature-two mt-150 xl-mt-100">
        <div className="container">
          <div className="row gx-xl-5">
            <div className="col-lg-6 wow fadeInLeft">
              <div className="me-xxl-4">
                <div className="title-one mb-60 lg-mb-40">
                  <div className="upper-title">About Us</div>
                  <h3>{introTitle}</h3>
                  <p className="fs-22">{introText}</p>
                </div>

                <a href={primaryButtonLink} className="btn-two">{primaryButtonLabel}</a>
                <div className="counter-wrapper border-top pt-40 md-pt-10 mt-65 md-mt-40">
                  <div className="row">
                    {stats.slice(0, 2).map((stat, index) => (
                      <div className="col-xxl-6 col-sm-6" key={`about-stat-${index}`}>
                        <div className="counter-block-one mt-20">
                          <div className="main-count fw-500 color-dark">{stat.title}</div>
                          <span>{stat.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6 wow fadeInRight">
              <div className="block-two md-mt-40">
                <div className="bg-wrapper">
                  <h5>Who we are?</h5>
                  <p className="fs-22 lh-lg mt-20">{introText}</p>
                  <h5 className="top-line">Our mission</h5>
                  <p className="fs-22 lh-lg mt-20">
                    We run a data-driven property platform focused on speed, trust, and measurable client results.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="video-banner-one mt-150 xl-mt-120 md-mt-80">
        <div className="container">
          <div className="bg-wrapper position-relative z-1 overflow-hidden d-flex align-items-center justify-content-center" style={{ backgroundImage: `url(${videoImage})` }}>
            <a className="fancybox video-icon d-flex align-items-center justify-content-center rounded-circle tran3s" data-fancybox="" href={videoUrl} tabIndex={-1}>
              <i className="fa-solid fa-play"></i>
            </a>
          </div>
        </div>
      </div>

      <div className="block-feature-five position-relative z-1 pt-170 xl-pt-120 pb-130 xl-pb-100 lg-pb-80">
        <div className="container">
          <div className="row">
            <div className="col-xl-8 m-auto">
              <div className="title-one text-center mb-35 lg-mb-20">
                <h3>We are here to help you get your dream home.</h3>
                <p className="fs-24 color-dark">It is easy to start with these simple steps.</p>
              </div>
            </div>
          </div>
          <div className="row justify-content-between">
            <div className="col-xxl-11 m-auto">
              <div className="row gx-xl-5 justify-content-center">
                {processCards.slice(0, 3).map((card, index) => (
                  <div className="col-lg-4 col-sm-6" key={`process-card-${index}`}>
                    <div className={`card-style-one text-center wow fadeInUp mt-40 ${index === 1 ? "arrow position-relative" : ""}`} data-wow-delay={`${index * 0.1}s`}>
                      <img src="/images/lazy.svg" data-src={card.icon} alt="" className="lazy-img m-auto icon" />
                      <h5 className="mt-50 lg-mt-30 mb-15">{card.title}</h5>
                      <p className="pe-xxl-4 ps-xxl-4">{card.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="feedback-section-six bg-pink-two position-relative z-1 pt-110 xl-pt-80 pb-100 xl-pb-80">
        <div className="container">
          <div className="title-one text-center mb-80 xl-mb-50 md-mb-30">
            <h3>Client Feedback</h3>
            <p className="fs-20 mt-xs">Client satisfaction speaks louder than our words.</p>
          </div>

          <div className="feedback-slider-three">
            {testimonials.map((testimonial, index) => (
              <div className="item" key={`feedback-${index}`}>
                <div className="feedback-block-six rounded-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <ul className="rating style-none d-flex">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <li key={`star-${starIndex}`}><i className="fa-sharp fa-solid fa-star"></i></li>
                      ))}
                    </ul>
                    <img src="/images/icon/icon_29.svg" alt="" className="icon" />
                  </div>
                  <blockquote>{testimonial.quote}</blockquote>
                  <div className="d-flex align-items-center justify-content-between">
                    <h6 className="fs-20 m0">{testimonial.name}, <span className="fw-normal opacity-50">{testimonial.location}</span></h6>
                    <img src={testimonial.avatar} alt={testimonial.name} className="rounded-circle avatar" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="agent-section-one position-relative z-1 mt-150 xl-mt-120">
        <div className="container">
          <div className="position-relative">
            <div className="title-one mb-85 lg-mb-50 wow fadeInLeft">
              <h3>Our Agents</h3>
              <p className="fs-22 mt-xs">Meet the active team managing listings and client tours.</p>
            </div>

            <div className="wrapper position-relative z-1">
              <div className="agent-slider-one">
                {agents.slice(0, 5).map((agent) => (
                  <div className="item" key={`about-agent-${agent.id}`}>
                    <div className="agent-card-one position-relative">
                      <div className="img border-20">
                        <img src={toStringValue(agent.avatar_path, "/images/agent/img_01.jpg")} alt={agent.full_name} className="w-100 tran5s" />
                      </div>
                      <div className="text-center">
                        <h6>{agent.full_name}</h6>
                        <a href="/agents" className="stretched-link">{toStringValue(agent.position, "Property Agent")}</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="section-btn text-center md-mt-60">
              <a href="/agents" className="btn-five">Meet Entire Team</a>
            </div>
          </div>
        </div>
      </div>

      <FooterCta
        title={toStringValue(pageContent?.cta_title, "Start your journey as a retailer.")}
        buttonLabel={toStringValue(pageContent?.cta_button_label, "Get Started")}
        buttonLink={toStringValue(pageContent?.cta_button_link, "/contact")}
      />
    </MarketingShell>
  );
}

function ContactTemplatePage({
  pageTitle,
  pageContent,
}: DynamicMarketingTemplatePageProps) {
  const title = toStringValue(pageContent?.hero_title, pageTitle ?? "Contact Us");
  const subtitle = toStringValue(pageContent?.hero_subtitle, "Questions? Feel free to reach out via message.");
  const email = toStringValue(pageContent?.contact_email, "hello@homerealestate.com");
  const phone = toStringValue(pageContent?.contact_phone, "+1 757 699 4478");
  const liveChatUrl = toStringValue(pageContent?.contact_chat_url, "https://www.homerealestate.com/live-chat");
  const mapEmbedUrl = toStringValue(
    pageContent?.contact_map_embed_url,
    "https://maps.google.com/maps?width=600&height=400&hl=en&q=New%20York&t=&z=12&ie=UTF8&iwloc=B&output=embed",
  );

  return (
    <MarketingShell>
      <div className="contact-us border-top mt-130 xl-mt-100 pt-80 lg-pt-60">
        <div className="container">
          <div className="row">
            <div className="col-xxl-9 col-xl-8 col-lg-10 m-auto">
              <div className="title-one text-center wow fadeInUp">
                <h3>{title}</h3>
                <p className="fs-22 mt-20">{subtitle}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="address-banner wow fadeInUp mt-60 lg-mt-40">
          <div className="container">
            <div className="d-flex flex-wrap justify-content-center justify-content-lg-between">
              <div className="block position-relative z-1 mt-25">
                <div className="d-xl-flex align-items-center">
                  <div className="icon rounded-circle d-flex align-items-center justify-content-center">
                    <img src="/images/lazy.svg" data-src="/images/icon/icon_39.svg" alt="" className="lazy-img" />
                  </div>
                  <div className="text">
                    <p className="fs-22">Email us anytime</p>
                    <a href={`mailto:${email}`} className="tran3s">{email}</a>
                  </div>
                </div>
              </div>

              <div className="block position-relative skew-line z-1 mt-25">
                <div className="d-xl-flex align-items-center">
                  <div className="icon rounded-circle d-flex align-items-center justify-content-center">
                    <img src="/images/lazy.svg" data-src="/images/icon/icon_39.svg" alt="" className="lazy-img" />
                  </div>
                  <div className="text">
                    <p className="fs-22">Our hotline number</p>
                    <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="tran3s">{phone}</a>
                  </div>
                </div>
              </div>

              <div className="block position-relative z-1 mt-25">
                <div className="d-xl-flex align-items-center">
                  <div className="icon rounded-circle d-flex align-items-center justify-content-center">
                    <img src="/images/lazy.svg" data-src="/images/icon/icon_39.svg" alt="" className="lazy-img" />
                  </div>
                  <div className="text">
                    <p className="fs-22">Live chat support</p>
                    <a href={liveChatUrl} className="tran3s" target="_blank" rel="noopener noreferrer">
                      {liveChatUrl.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-pink mt-150 xl-mt-120 md-mt-80">
          <div className="row">
            <div className="col-xl-7 col-lg-6">
              <div className="form-style-one wow fadeInUp">
                <ContactInquiryForm
                  source="contact-page"
                  heading={toStringValue(pageContent?.contact_form_heading, "Send Message")}
                  submitLabel={toStringValue(pageContent?.contact_form_button, "Send Message")}
                  defaultMessage={toStringValue(pageContent?.contact_form_default_message, "")}
                />
              </div>
            </div>
            <div className="col-xl-5 col-lg-6 d-flex order-lg-first">
              <div className="contact-map-banner w-100">
                <div className="gmap_canvas h-100 w-100">
                  <iframe
                    className="gmap_iframe h-100 w-100"
                    src={mapEmbedUrl}
                    title="Office Location"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}

function FaqTemplatePage({
  pageTitle,
  pageContent,
}: DynamicMarketingTemplatePageProps) {
  const title = toStringValue(pageContent?.hero_title, pageTitle ?? "Question & Answers");
  const subtitle = toStringValue(pageContent?.hero_subtitle, "Answers to frequent buying, renting, and account questions.");
  const groups = parseFaqGroups(pageContent?.faq_groups, [
    {
      title: "Selling",
      items: [
        {
          question: "How do I list my property?",
          answer: "Create an account, submit your listing details, and publish after review.",
        },
        {
          question: "How quickly do leads arrive?",
          answer: "Most listings start receiving inquiries within the first 24-48 hours.",
        },
      ],
    },
    {
      title: "Renting",
      items: [
        {
          question: "Can I schedule tours online?",
          answer: "Yes. Tour requests are submitted instantly from listing detail pages.",
        },
        {
          question: "Can I filter by amenities?",
          answer: "Yes. Use listing filters for beds, bath, location, and amenities.",
        },
      ],
    },
    {
      title: "Payments",
      items: [
        {
          question: "Is financing support available?",
          answer: "Yes. Use our mortgage calculator and contact an assigned agent.",
        },
      ],
    },
  ]);

  return (
    <MarketingShell>
      <BannerOne title={title} subtitle={subtitle} currentLabel={title} />

      <div className="faq-section-two mt-130 xl-mt-100 mb-150 xl-mb-100">
        <div className="container">
          <div className="row">
            <div className="col-lg-4 wow fadeInLeft">
              <div className="faq-sidebar">
                <div className="bg-wrapper">
                  <ul className="style-none">
                    {groups.map((group, index) => (
                      <li key={`faq-nav-${index}`}>
                        <a href={`#faq-group-${index}`}>{`${index + 1}. `}<span>{group.title}</span></a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-wrapper text-center mt-35">
                  <h4 className="mb-35">Do not find your answer?</h4>
                  <a href="/contact" className="btn-five">Contact us</a>
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              {groups.map((group, groupIndex) => {
                const accordionId = `faq-accordion-${groupIndex}`;

                return (
                  <div className="accordion-style-two no-bg p0 ms-xl-5" key={accordionId}>
                    <div className={`accordion-title text-uppercase fw-500 ${groupIndex === 0 ? "md-pt-90" : "pt-90"}`} id={`faq-group-${groupIndex}`}>
                      {group.title}
                    </div>
                    <div className="accordion p0" id={accordionId}>
                      {group.items.map((item, itemIndex) => {
                        const collapseId = `${accordionId}-item-${itemIndex}`;
                        const isOpen = itemIndex === 0;

                        return (
                          <div className="accordion-item" key={collapseId}>
                            <h2 className="accordion-header">
                              <button
                                className={`accordion-button ${isOpen ? "" : "collapsed"}`}
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target={`#${collapseId}`}
                                aria-expanded={isOpen}
                                aria-controls={collapseId}
                              >
                                {item.question}
                              </button>
                            </h2>
                            <div id={collapseId} className={`accordion-collapse collapse ${isOpen ? "show" : ""}`} data-bs-parent={`#${accordionId}`}>
                              <div className="accordion-body">
                                <p>{item.answer}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <FooterCta
        title={toStringValue(pageContent?.cta_title, "Start your journey as a retailer.")}
        buttonLabel={toStringValue(pageContent?.cta_button_label, "Get Started")}
        buttonLink={toStringValue(pageContent?.cta_button_link, "/contact")}
      />
    </MarketingShell>
  );
}

function PricingTemplatePage({
  templateKey,
  pageTitle,
  pageContent,
}: DynamicMarketingTemplatePageProps) {
  const title = toStringValue(pageContent?.hero_title, pageTitle ?? "Pricing Plan");
  const subtitle = toStringValue(
    pageContent?.hero_subtitle,
    "Choose a plan that fits your team size and listing volume.",
  );

  const plans = parsePricingPlans(pageContent?.pricing_plans, [
    {
      id: "free",
      name: "Free Plan",
      description: "Great for individual person",
      cadenceLabel: "per user/month",
      monthlyPrice: "$0",
      yearlyPrice: "$0",
      ctaLabel: "Active",
      ctaLink: "/contact",
      highlighted: true,
      features: [
        { label: "All operating supported", included: false },
        { label: "Multiple users", included: false },
        { label: "Refund", included: false },
        { label: "12 months duration", included: true },
        { label: "Live chat", included: true },
        { label: "Send invite via link", included: true },
      ],
    },
    {
      id: "standard",
      name: "Standard",
      description: "Great for startup",
      cadenceLabel: "per user/month",
      monthlyPrice: "$89",
      yearlyPrice: "$59",
      ctaLabel: "Get Started",
      ctaLink: "/contact",
      features: [
        { label: "All operating supported", included: false },
        { label: "Multiple users", included: false },
        { label: "Refund", included: true },
        { label: "12 months duration", included: true },
        { label: "Live chat", included: true },
        { label: "Send invite via link", included: true },
      ],
    },
    {
      id: "business",
      name: "Business",
      description: "Great for large business",
      cadenceLabel: "per user/month",
      monthlyPrice: "$147",
      yearlyPrice: "$99",
      ctaLabel: "Get Started",
      ctaLink: "/contact",
      features: [
        { label: "All operating supported", included: true },
        { label: "Multiple users", included: true },
        { label: "Refund", included: true },
        { label: "12 months duration", included: true },
        { label: "Live chat", included: true },
        { label: "Send invite via link", included: true },
      ],
    },
  ]);

  const isStyleTwo = templateKey.toLowerCase() === "pricing_02";

  if (isStyleTwo) {
    return (
      <MarketingShell>
        <BannerTwo
          title={title}
          subtitle={subtitle}
          currentLabel={title}
          backgroundImage={toStringValue(pageContent?.hero_background, "/images/media/img_49.jpg")}
        />

        <div className="pricing-section-two mt-150 xl-mt-100 mb-170 xl-mb-100">
          <div className="container">
            <div className="row">
              <div className="col-xxl-6 col-xl-5">
                <div className="title-one">
                  <h3>No hidden charge, get your plan.</h3>
                </div>
              </div>
              <div className="col-xl-5 ms-auto">
                <p className="fs-24 pt-20">
                  Try free plan features for 14 days. No credit card required.
                </p>
              </div>
            </div>
            <PricingPlanSwitcher plans={plans} variant="cards" />
          </div>
        </div>

        <FooterCta
          title={toStringValue(pageContent?.cta_title, "Start your journey as a retailer.")}
          buttonLabel={toStringValue(pageContent?.cta_button_label, "Get Started")}
          buttonLink={toStringValue(pageContent?.cta_button_link, "/contact")}
        />
      </MarketingShell>
    );
  }

  return (
    <MarketingShell>
      <BannerOne title={title} subtitle={subtitle} currentLabel={title} />

      <div className="pricing-section-one mt-150 xl-mt-100">
        <div className="container">
          <div className="row">
            <div className="col-lg-10 m-auto">
              <div className="title-one text-center mb-40 lg-mb-30 wow fadeInUp">
                <h3>Unbeatable prices, no contracts, simple and easy.</h3>
                <p className="fs-24">Switch between monthly and yearly plans without reloading.</p>
              </div>
            </div>
          </div>

          <PricingPlanSwitcher plans={plans} variant="matrix" />
        </div>
      </div>

      <div className="fancy-banner-three position-relative text-center z-1 pt-140 xl-pt-100 md-pt-80 pb-150 xl-pb-100">
        <div className="container">
          <div className="row">
            <div className="col-xl-7 col-md-8 m-auto">
              <div className="title-one mb-45 md-mb-30">
                <h2>Any inquiry? Feel free to contact us.</h2>
              </div>
              <a href="/contact" className="btn-five text-uppercase">Send Message</a>
            </div>
          </div>
        </div>
      </div>

      <FooterCta
        title={toStringValue(pageContent?.cta_title, "Start your journey as a retailer.")}
        buttonLabel={toStringValue(pageContent?.cta_button_label, "Get Started")}
        buttonLink={toStringValue(pageContent?.cta_button_link, "/contact")}
      />
    </MarketingShell>
  );
}

async function resolveFeaturedProjectProperty(pageContent?: Record<string, unknown>) {
  const explicitSlug = toStringValue(pageContent?.project_slug, "");

  if (explicitSlug !== "") {
    const detailResponse = await fetchPublicProperty(explicitSlug);
    if (detailResponse.ok && detailResponse.data) {
      return detailResponse.data;
    }
  }

  const listResponse = await fetchPublicProperties({
    per_page: 1,
    sort: "newest",
  });

  return listResponse.data?.[0] ?? null;
}

async function ProjectTemplatePage({
  templateKey,
  pageTitle,
  pageContent,
}: DynamicMarketingTemplatePageProps) {
  const normalizedTemplateKey = templateKey.toLowerCase();
  const title = toStringValue(pageContent?.hero_title, pageTitle ?? "Projects");
  const subtitle = toStringValue(pageContent?.hero_subtitle, "Over 745,000 listings and projects available.");
  const propertyRouteBase = toStringValue(pageContent?.properties_path, "/properties");
  const sort = toStringValue(pageContent?.sort, "newest");

  if (normalizedTemplateKey === "project_details_01") {
    const property = await resolveFeaturedProjectProperty(pageContent);

    if (!property) {
      return (
        <MarketingShell>
          <BannerTwo title={title} subtitle={subtitle} currentLabel={title} />
          <div className="project-details-one mt-150 xl-mt-100 mb-170 xl-mb-100">
            <div className="container">
              <div className="alert alert-warning">No published project/property found.</div>
            </div>
          </div>
        </MarketingShell>
      );
    }

    const gallery = Array.isArray(property.images) && property.images.length > 0
      ? property.images
      : [
        {
          id: property.id,
          path: propertyImage(property),
          alt_text: propertyAlt(property),
          sort_order: 0,
          is_primary: true,
        },
      ];

    return (
      <MarketingShell>
        <BannerTwo
          title={toStringValue(pageContent?.hero_title, property.title)}
          subtitle={subtitle}
          currentLabel={toStringValue(pageContent?.hero_title, property.title)}
          backgroundImage={toStringValue(pageContent?.hero_background, "/images/media/img_49.jpg")}
        />

        <div className="project-details-one mt-150 xl-mt-100 mb-170 xl-mb-100">
          <div className="container">
            <div className="row gx-xxl-5">
              <div className="col-lg-6 order-lg-first">
                {gallery.slice(0, 3).map((image, index) => (
                  <figure className="image-wrapper" key={`project-image-${index}`}>
                    <img src={image.path} alt={image.alt_text ?? property.title} className="lazy-img w-100" />
                  </figure>
                ))}
              </div>
              <div className="col-lg-6">
                <div className="details-text ps-xxl-5 md-mt-40">
                  <div className="tag fw-500 text-uppercase">{toTitleCase(property.property_type)}</div>
                  <h3>{property.title}</h3>
                  <p className="fs-24 pt-45 xl-pt-30 pb-45 xl-pb-30">{property.description ?? "No long description has been added yet."}</p>
                  <h4 className="mb-40">Project Details</h4>
                  <div className="project-info-outline">
                    <div className="main-bg">
                      <ul className="style-none">
                        <li className="position-relative z-1">
                          <div className="num fw-light">01</div>
                          <img src="/images/lazy.svg" data-src="/images/icon/icon_43.svg" alt="" className="lazy-img icon" />
                          <strong>Date</strong>
                          <span>{formatDate(property.published_at, "Not published")}</span>
                        </li>
                        <li className="position-relative z-1">
                          <div className="num fw-light">02</div>
                          <img src="/images/lazy.svg" data-src="/images/icon/icon_44.svg" alt="" className="lazy-img icon" />
                          <strong>Address</strong>
                          <span>{propertyAddress(property)}</span>
                        </li>
                        <li className="position-relative z-1">
                          <div className="num fw-light">03</div>
                          <img src="/images/lazy.svg" data-src="/images/icon/icon_45.svg" alt="" className="lazy-img icon" />
                          <strong>Price</strong>
                          <span>{formatPrice(property.price)}</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <p className="fs-20 pt-50 pb-35">
                    {toStringValue(pageContent?.project_details_footer, "All project details are synced from live property data.")}
                  </p>
                  <ul className="style-none d-flex align-items-center social-icon">
                    <li>Share :</li>
                    <li><a href="#"><i className="fa-brands fa-facebook-f"></i></a></li>
                    <li><a href="#"><i className="bi bi-twitter-x"></i></a></li>
                    <li><a href="#"><i className="bi bi-instagram"></i></a></li>
                  </ul>
                  <div className="mt-45 pt-40">
                    <Link href={propertyDetailsPath(propertyRouteBase, property.slug)} className="btn-four rounded-circle inverse">
                      <i className="bi bi-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <FooterCta
          title={toStringValue(pageContent?.cta_title, "Start your journey as a retailer.")}
          buttonLabel={toStringValue(pageContent?.cta_button_label, "Get Started")}
          buttonLink={toStringValue(pageContent?.cta_button_link, "/contact")}
        />
      </MarketingShell>
    );
  }

  const perPage = normalizedTemplateKey === "project_01" ? 9 : normalizedTemplateKey === "project_02" ? 6 : normalizedTemplateKey === "project_03" ? 6 : 5;
  const response = await fetchPublicProperties({
    per_page: perPage,
    sort: sort === "price_asc" || sort === "price_desc" || sort === "newest" ? sort : "newest",
  });
  const properties = response.data ?? [];

  const isBannerOne = normalizedTemplateKey === "project_01" || normalizedTemplateKey === "project_02";
  const gridClass = normalizedTemplateKey === "project_01"
    ? "grid-3column pt-40 xl-pt-10"
    : normalizedTemplateKey === "project_02"
      ? "grid-2column pt-40 xl-pt-10"
      : normalizedTemplateKey === "project_03"
        ? "grid-2column pt-10"
        : "grid-1column pt-40 lg-pt-30";

  return (
    <MarketingShell>
      {isBannerOne ? (
        <BannerOne title={title} subtitle={subtitle} currentLabel={title} />
      ) : (
        <BannerTwo title={title} subtitle={subtitle} currentLabel={title} />
      )}

      <div className={`project-section-one mt-150 xl-mt-100 ${normalizedTemplateKey === "project_04" ? "mb-170 xl-mb-100" : ""}`}>
        <div className="container">
          <div className="listing-header-filter d-sm-flex justify-content-between align-items-center mb-35">
            <div>
              Showing <span className="color-dark fw-500">{properties.length}</span> of{" "}
              <span className="color-dark fw-500">{(response.meta?.total ?? properties.length).toLocaleString("en-US")}</span> results
            </div>
            <div className="d-flex align-items-center xs-mt-20">
              <div className="short-filter d-flex align-items-center">
                <div className="fs-16 me-2">Sort by:</div>
                <select className="nice-select rounded-0" defaultValue={sort}>
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price Low</option>
                  <option value="price_desc">Price High</option>
                </select>
              </div>
            </div>
          </div>

          {response.ok ? null : (
            <div className="alert alert-danger mb-35">
              {response.message ?? "Unable to load projects right now."}
            </div>
          )}

          <div id="isotop-gallery-wrapper" className={gridClass}>
            <div className="grid-sizer"></div>
            {properties.map((property) => {
              if (normalizedTemplateKey === "project_03") {
                return (
                  <div className="isotop-item" key={`project-3-${property.id}`}>
                    <div className="project-block-two mt-80 lg-mt-40">
                      <figure className="image-wrapper m0 position-relative z-1 overflow-hidden">
                        <div className="tag fw-500 text-uppercase">{toTitleCase(property.property_type)}</div>
                        <a href={propertyImage(property)} className="d-block position-relative" data-fancybox data-caption={property.title}>
                          <img src={propertyImage(property)} alt={propertyAlt(property)} className="w-100 tran5s" />
                        </a>
                      </figure>
                      <div className="caption">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="title">
                            <div className="date position-relative">{formatDate(property.published_at)}</div>
                            <Link href={propertyDetailsPath(propertyRouteBase, property.slug)}><h4 className="tran3s">{property.title}</h4></Link>
                          </div>
                          <Link href={propertyDetailsPath(propertyRouteBase, property.slug)} className="btn-thirteen rounded-circle">
                            <i className="bi bi-arrow-up-right"></i>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (normalizedTemplateKey === "project_04") {
                return (
                  <div className="isotop-item" key={`project-4-${property.id}`}>
                    <div className="project-block-three mt-80 lg-mt-50">
                      <div className="row gx-xxl-5 align-items-center">
                        <div className="col-lg-6">
                          <figure className="image-wrapper position-relative z-1 overflow-hidden">
                            <a href={propertyImage(property)} className="d-block position-relative" data-fancybox data-caption={property.title}>
                              <img src={propertyImage(property)} alt={propertyAlt(property)} className="w-100 tran5s" />
                            </a>
                          </figure>
                        </div>
                        <div className="col-lg-6 ms-auto">
                          <div className="caption ps-xxl-5">
                            <div className="tag fw-500 text-uppercase">{toTitleCase(property.property_type)}</div>
                            <h3><Link href={propertyDetailsPath(propertyRouteBase, property.slug)}>{property.title}</Link></h3>
                            <p className="fs-24 pt-45 lg-pt-30 md-pt-10 pb-50 lg-pb-30 md-pb-10">
                              {property.description ?? "Your leading real estate advocate, transforming houses into dreams."}
                            </p>
                            <Link href={propertyDetailsPath(propertyRouteBase, property.slug)} className="btn-thirteen rounded-circle">
                              <i className="fa-thin fa-arrow-up-right"></i>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="isotop-item" key={`project-1-2-${property.id}`}>
                  <div className="project-block-one mt-50 lg-mt-30">
                    <figure className="image-wrapper m0 position-relative z-1 overflow-hidden">
                      <img src={propertyImage(property)} alt={propertyAlt(property)} className="w-100" />
                      <Link href={propertyDetailsPath(propertyRouteBase, property.slug)} className="btn-four inverse rounded-circle">
                        <i className="bi bi-arrow-up-right"></i>
                      </Link>
                    </figure>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {(normalizedTemplateKey === "project_01" || normalizedTemplateKey === "project_02" || normalizedTemplateKey === "project_03") ? (
        <div className="fancy-banner-three position-relative text-center z-1 pt-140 xl-pt-100 md-pt-80 pb-150 xl-pb-100">
          <div className="container">
            <div className="row">
              <div className="col-xl-7 col-md-8 m-auto">
                <div className="title-one mb-45 md-mb-30">
                  <h2>Any inquiry? Feel free to contact us.</h2>
                </div>
                <a href="/contact" className="btn-five text-uppercase">Send Message</a>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <FooterCta
        title={toStringValue(pageContent?.cta_title, "Start your journey as a retailer.")}
        buttonLabel={toStringValue(pageContent?.cta_button_label, "Get Started")}
        buttonLink={toStringValue(pageContent?.cta_button_link, "/contact")}
      />
    </MarketingShell>
  );
}

function ServiceTemplatePage({
  templateKey,
  pageTitle,
  pageContent,
}: DynamicMarketingTemplatePageProps) {
  const title = toStringValue(pageContent?.hero_title, pageTitle ?? "Our Services");
  const subtitle = toStringValue(pageContent?.hero_subtitle, "Services tailored for buyers, sellers, and renters.");
  const introTitle = toStringValue(pageContent?.intro_title, "Clients rely on our services.");
  const introText = toStringValue(
    pageContent?.intro_text,
    "We blend technology and expert guidance to deliver faster, safer property transactions.",
  );
  const cards = parseSimpleCards(pageContent?.service_cards, [
    {
      title: "Buy a Home",
      description: "Explore verified listings and compare neighborhoods with confidence.",
      buttonLabel: "Find Home",
      buttonLink: "/properties",
      icon: "/images/icon/icon_69.svg",
    },
    {
      title: "Rent a Home",
      description: "Discover rental options with advanced filter and availability checks.",
      buttonLabel: "Rent Home",
      buttonLink: "/properties",
      icon: "/images/icon/icon_70.svg",
    },
    {
      title: "Sell Home",
      description: "List, market, and close quickly with expert pricing support.",
      buttonLabel: "Sell Home",
      buttonLink: "/portal/agent",
      icon: "/images/icon/icon_71.svg",
    },
    {
      title: "Mortgage",
      description: "Plan financing using live calculator defaults from your page settings.",
      buttonLabel: "Learn More",
      buttonLink: "/contact",
      icon: "/images/icon/icon_69.svg",
    },
    {
      title: "Consulting",
      description: "Get one-on-one consultation for market timing and strategy.",
      buttonLabel: "Consult",
      buttonLink: "/contact",
      icon: "/images/icon/icon_70.svg",
    },
    {
      title: "Property Management",
      description: "Manage tenancy, maintenance, and recurring operations with our team.",
      buttonLabel: "Manage",
      buttonLink: "/contact",
      icon: "/images/icon/icon_71.svg",
    },
  ]);
  const testimonials = parseTestimonials(pageContent?.testimonials, [
    {
      quote: "Efficient, knowledgeable, and smooth from listing to closing.",
      name: "Jonathan Harry",
      location: "Milan, Italy",
      avatar: "/images/media/img_01.jpg",
    },
    {
      quote: "Fast responses and quality recommendations. Strongly recommended.",
      name: "Sofia Rena",
      location: "New York, USA",
      avatar: "/images/media/img_02.jpg",
    },
    {
      quote: "Professional service with clear reporting at every stage.",
      name: "Rashed Kabir",
      location: "Chicago, USA",
      avatar: "/images/media/img_03.jpg",
    },
  ]);

  const normalizedTemplateKey = templateKey.toLowerCase();
  const isStyleTwo = normalizedTemplateKey === "service_02";
  const isDetails = normalizedTemplateKey === "service_details";

  if (isDetails) {
    const selectedKey = toStringValue(pageContent?.service_key, "");
    const selectedService = cards.find((card) => toSlug(card.title) === toSlug(selectedKey)) ?? cards[0];
    const benefits = toStringArray(pageContent?.service_benefits);
    const sectionBenefits = benefits.length > 0
      ? benefits
      : [
        "Loan and low interest facility",
        "100k+ property listings added and updated",
        "Expert agents for quick support",
        "Priority access to exclusive sale",
      ];

    return (
      <MarketingShell>
        <BannerOne title={title} subtitle={subtitle} currentLabel={title} />

        <div className="service-details mt-150 xl-mt-100 mb-150 xl-mb-100">
          <div className="container">
            <div className="row">
              <div className="col-lg-8">
                <div className="service-post">
                  <div className="btn-line fw-500 text-uppercase">{selectedService.title}</div>
                  <h3 className="mb-30">{toStringValue(pageContent?.service_detail_title, selectedService.title)}</h3>
                  <p className="fs-20 lh-lg pb-25">{selectedService.description}</p>
                  <p className="fs-20 lh-lg">{introText}</p>

                  <div className="img-gallery pt-15 pb-70 lg-pb-50">
                    <div className="row">
                      <div className="col-8">
                        <img src="/images/lazy.svg" data-src={toStringValue(pageContent?.service_image_main, "/images/media/img_57.jpg")} alt="" className="lazy-img w-100 mt-20" />
                      </div>
                      <div className="col-4">
                        <img src="/images/lazy.svg" data-src={toStringValue(pageContent?.service_image_side, "/images/media/img_58.jpg")} alt="" className="lazy-img w-100 mt-20" />
                      </div>
                    </div>
                  </div>

                  <h4 className="mb-30">Benefits you will get</h4>
                  <p className="fs-20 lh-lg pb-25">All items below are dynamic and can be managed from page content payload.</p>
                  <ul className="list-style-one fs-22 color-dark style-none">
                    {sectionBenefits.map((benefit) => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </ul>
                  <a href={selectedService.buttonLink} className="btn-two mt-30">{selectedService.buttonLabel}</a>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="ms-xl-5">
                  <div className="service-sidebar md-mt-80">
                    <div className="service-category">
                      <ul className="style-none">
                        {cards.map((card) => (
                          <li key={`service-cat-${card.title}`}>
                            <a href="#" className={card.title === selectedService.title ? "active" : ""}>{card.title}</a>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="contact-banner text-center mt-45">
                      <h4 className="mb-35 text-white">Any questions? Let us talk.</h4>
                      <a href="/contact" className="btn-two">Let us Talk</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <FooterCta
          title={toStringValue(pageContent?.cta_title, "Start your journey as a retailer.")}
          buttonLabel={toStringValue(pageContent?.cta_button_label, "Get Started")}
          buttonLink={toStringValue(pageContent?.cta_button_link, "/contact")}
        />
      </MarketingShell>
    );
  }

  if (isStyleTwo) {
    return (
      <MarketingShell>
        <BannerTwo title={title} subtitle={subtitle} currentLabel={title} />

        <div className="block-feature-eleven mt-150 xl-mt-100">
          <div className="container container-large">
            <div className="row">
              <div className="col-lg-5">
                <div className="title-one md-mb-40">
                  <h3>{introTitle}</h3>
                </div>
              </div>
              <div className="col-xxl-6 col-lg-7 ms-auto">
                <p className="fs-24 lh-lg mb-30 color-dark">{introText}</p>
                <div className="d-inline-flex flex-wrap align-items-center">
                  <a href="/about-us" className="btn-five md rounded-0 mt-20 me-5"><span>More Details</span></a>
                  <a href="/contact" className="btn-three mt-20"><span>Request a Callback</span> <i className="fa-light fa-arrow-right-long"></i></a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="block-feature-seven position-relative z-1 mt-150 xl-mt-120 lg-mt-100">
          <div className="container container-large">
            <div className="position-relative">
              <div className="text-center wow fadeInUp">
                <div className="title-one">
                  <h3>We are here to help you</h3>
                  <p className="fs-22 mt-xs">Explore featured service cards.</p>
                </div>
              </div>

              <div className="wrapper position-relative z-1 mt-45 lg-mt-20 mb-100 lg-mb-50">
                <div className="row gx-xxl-5">
                  {cards.slice(0, 3).map((card, index) => (
                    <div className="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay={`${index * 0.1}s`} key={`service-two-card-${index}`}>
                      <div className="card-style-two overflow-hidden position-relative z-1 mt-30">
                        <img src="/images/lazy.svg" data-src="/images/media/img_19.jpg" alt="" className="lazy-img w-100 tran5s" />
                        <div className="content text-center">
                          <div className="btn-line tran3s fw-500 text-uppercase">{card.title}</div>
                          <h4 className="mt-15 mb-35">{card.description}</h4>
                          <a href={card.buttonLink} className="btn-four rounded-circle m-auto"><i className="bi bi-arrow-up-right"></i></a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="block-feature-seventeen dark-bg position-relative z-1 pt-120 xl-pt-80 pb-140 xl-pb-80">
          <div className="container">
            <div className="row">
              <div className="col-xl-8 m-auto">
                <div className="title-one text-center wow fadeInUp mb-40 lg-mb-20">
                  <h3 className="text-white">Core Services</h3>
                  <p className="fs-22 color-dark text-white">All cards are dynamic and connected to CMS content payload.</p>
                </div>
              </div>
            </div>
            <div className="row gx-xxl-5">
              {cards.map((card, index) => (
                <div className="col-lg-4 col-md-6 d-flex mt-40 wow fadeInUp" data-wow-delay={`${(index % 3) * 0.1}s`} key={`service-two-core-${index}`}>
                  <div className="card-style-ten rounded-0 d-flex align-items-start flex-column w-100 h-100">
                    <div className="icon d-flex align-items-center justify-content-center rounded-circle tran3s">
                      <img src="/images/lazy.svg" data-src={card.icon} alt="" className="lazy-img" />
                    </div>
                    <h6>{card.title}</h6>
                    <p>{card.description}</p>
                    <a href={card.buttonLink} className="btn-twelve sm mt-auto">{card.buttonLabel}</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <FooterCta
          title={toStringValue(pageContent?.cta_title, "Start your journey as a retailer.")}
          buttonLabel={toStringValue(pageContent?.cta_button_label, "Get Started")}
          buttonLink={toStringValue(pageContent?.cta_button_link, "/contact")}
        />
      </MarketingShell>
    );
  }

  return (
    <MarketingShell>
      <BannerOne title={title} subtitle={subtitle} currentLabel={title} />

      <div className="block-feature-eight position-relative z-1 mt-170 xl-mt-120">
        <div className="container">
          <div className="position-relative">
            <div className="row">
              <div className="col-lg-6">
                <div className="pe-xl-5 wow fadeInLeft">
                  <div className="row align-items-end">
                    <div className="col-6">
                      <div className="media-block position-relative z-1">
                        <img src="/images/lazy.svg" data-src="/images/assets/screen_11.png" alt="" className="lazy-img screen_03 mb-40" />
                        <img src="/images/lazy.svg" data-src={toStringValue(pageContent?.service_image_main, "/images/media/img_54.jpg")} alt="" className="lazy-img main-img w-100" />
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="media-block position-relative z-1">
                        <img src="/images/lazy.svg" data-src={toStringValue(pageContent?.service_image_side, "/images/media/img_53.jpg")} alt="" className="lazy-img main-img w-100" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="block-two ms-xxl-5 wow fadeInRight">
                  <div className="bg-wrapper md-mt-60">
                    <div className="title-one m0">
                      <h3>{introTitle}</h3>
                    </div>
                    <p className="fs-22 mt-45 mb-60 xl-mb-40 pe-xxl-5">{introText}</p>
                    <ul className="list-style-one fs-22 color-dark style-none">
                      {toStringArray(pageContent?.service_highlights).slice(0, 3).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <div className="mt-60 lg-mt-40">
                      <a href="/contact" className="btn-two">Contact Us</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="block-feature-seventeen bg-pink-three position-relative z-1 pt-120 xl-pt-80 pb-140 xl-pb-80">
        <div className="container">
          <div className="row">
            <div className="col-xl-8 m-auto">
              <div className="title-one text-center wow fadeInUp mb-40 lg-mb-20">
                <h3>Core Services</h3>
                <p className="fs-22 color-dark">All cards below are dynamic and reusable.</p>
              </div>
            </div>
          </div>
          <div className="row gx-xxl-5">
            {cards.map((card, index) => (
              <div className="col-lg-4 col-md-6 d-flex mt-40 wow fadeInUp" data-wow-delay={`${(index % 3) * 0.1}s`} key={`service-core-${index}`}>
                <div className="card-style-ten d-flex align-items-start flex-column w-100 h-100">
                  <div className="icon d-flex align-items-center justify-content-center rounded-circle tran3s">
                    <img src="/images/lazy.svg" data-src={card.icon} alt="" className="lazy-img" />
                  </div>
                  <h6>{card.title}</h6>
                  <p>{card.description}</p>
                  <a href={card.buttonLink} className="btn-twelve sm mt-auto">{card.buttonLabel}</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="feedback-section-one position-relative z-1 pt-70 md-pt-50 pb-80 md-pb-60">
        <div className="main-content m-auto">
          <div className="feedback-slider-one position-static">
            {testimonials.map((testimonial, index) => (
              <div className="item" key={`service-feedback-${index}`}>
                <div className="feedback-block-one text-center">
                  <div className="row align-items-center">
                    <div className="col-md-3">
                      <img src={testimonial.avatar} alt={testimonial.name} className="rounded-circle m-auto avatar" />
                      <h6 className="fs-20 m0 pt-10">{testimonial.name}</h6>
                      <span className="fs-16">{testimonial.location}</span>
                    </div>
                    <div className="col-md-6">
                      <blockquote>{testimonial.quote}</blockquote>
                    </div>
                    <div className="col-md-3">
                      <img src="/images/lazy.svg" data-src="/images/assets/rating_01.png" alt="" className="lazy-img m-auto" />
                      <p className="text-center m0 pt-10"><span className="fw-500 color-dark">Top Rating</span> (4.8)</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FooterCta
        title={toStringValue(pageContent?.cta_title, "Start your journey as a retailer.")}
        buttonLabel={toStringValue(pageContent?.cta_button_label, "Get Started")}
        buttonLink={toStringValue(pageContent?.cta_button_link, "/contact")}
      />
    </MarketingShell>
  );
}

async function AgencyTemplatePage({
  templateKey,
  pageTitle,
  pageContent,
}: DynamicMarketingTemplatePageProps) {
  const agentsResponse = await fetchPublicAgents({
    per_page: toIntegerValue(pageContent?.per_page, 80),
    sort: "name_asc",
  });

  const agents = agentsResponse.data ?? [];
  const agencies = buildAgencySummaries(agents);
  const title = toStringValue(pageContent?.hero_title, pageTitle ?? "Agency");
  const subtitle = toStringValue(pageContent?.hero_subtitle, "Over 745,000 listings, apartments, lots and plots available now.");
  const detailsLink = toStringValue(pageContent?.agency_details_path, "/agency-details");

  if (templateKey.toLowerCase() === "agency_details") {
    const selectedAgencySlug = toSlug(toStringValue(pageContent?.agency_slug, ""));
    const selectedAgency = agencies.find((agency) => agency.slug === selectedAgencySlug) ?? agencies[0];

    if (!selectedAgency) {
      notFound();
    }

    return (
      <MarketingShell>
        <BannerTwo
          title={toStringValue(pageContent?.hero_title, `${selectedAgency.name} Details`)}
          subtitle={subtitle}
          currentLabel={selectedAgency.name}
        />

        <div className="agency-details theme-details-one mt-130 xl-mt-100 pb-150 xl-pb-100">
          <div className="container">
            <div className="row">
              <div className="col-lg-8">
                <div className="info-pack-one p-20 mb-80 xl-mb-50">
                  <div className="row">
                    <div className="col-xl-6 d-flex">
                      <div className="media p-20 d-flex align-items-center justify-content-center bg-white position-relative z-1 w-100 me-xl-4">
                        <div className="tag top-0 bg-dark text-white position-absolute text-uppercase">{selectedAgency.listingCount} Listing</div>
                        <h3 className="m0">{selectedAgency.name.slice(0, 2).toUpperCase()}</h3>
                      </div>
                    </div>
                    <div className="col-xl-6">
                      <div className="ps-xxl-3 pe-xxl-3 pt-40 lg-pt-30 pb-45 lg-pb-10">
                        <h4>{selectedAgency.name}</h4>
                        <div className="designation fs-16">{[selectedAgency.city, selectedAgency.state].filter(Boolean).join(", ")}</div>
                        <div className="table-responsive">
                          <table className="table">
                            <tbody>
                              <tr><td>Location:</td><td>{[selectedAgency.city, selectedAgency.state, selectedAgency.country].filter(Boolean).join(", ")}</td></tr>
                              <tr><td>Phone:</td><td>{selectedAgency.phone || "N/A"}</td></tr>
                              <tr><td>Email:</td><td>{selectedAgency.email || "N/A"}</td></tr>
                              <tr><td>Website:</td><td>{selectedAgency.website || "N/A"}</td></tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="agency-overview bottom-line-dark pb-40 mb-80 xl-mb-50">
                  <h4 className="mb-20">Overview</h4>
                  <p className="fs-20 lh-lg pb-15">
                    {toStringValue(pageContent?.intro_text, "Agency profile and active listings are generated dynamically from assigned agents and properties.")}
                  </p>
                </div>

                <div className="agent-property-listing bottom-line-dark pb-20 mb-80 xl-mb-50">
                  <div className="d-sm-flex justify-content-between align-items-center mb-40 xs-mb-20">
                    <h4 className="mb-10">Listings</h4>
                    <div className="filter-nav-one xs-mt-40">
                      <ul className="style-none d-flex justify-content-center flex-wrap isotop-menu-wrapper">
                        <li className="is-checked">All</li>
                        <li>Sell</li>
                        <li>Rent</li>
                      </ul>
                    </div>
                  </div>
                  <div id="isotop-gallery-wrapper" className="grid-2column">
                    <div className="grid-sizer"></div>
                    {selectedAgency.properties.slice(0, 6).map((property) => (
                      <div className="isotop-item" key={`agency-detail-property-${property.id}`}>
                        <div className="listing-card-one shadow-none style-two mb-50">
                          <div className="img-gallery">
                            <div className="position-relative overflow-hidden">
                              <div className="tag bg-white text-dark fw-500">{property.listing_type === "rent" ? "FOR RENT" : "FOR SELL"}</div>
                              <img src={propertyImage(property)} className="w-100" alt={propertyAlt(property)} />
                            </div>
                          </div>
                          <div className="property-info d-flex justify-content-between align-items-end pt-30">
                            <div>
                              <strong className="price fw-500 color-dark">{formatPrice(property.price)}</strong>
                              <div className="address pt-5 m0">{propertyAddress(property)}</div>
                            </div>
                            <Link href={propertyDetailsPath("/properties", property.slug)} className="btn-four mb-5">
                              <i className="bi bi-arrow-up-right"></i>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="agent-finder bg-white p-30">
                  <h5 className="mb-40">Contact Agency</h5>
                  <ContactInquiryForm
                    source="agency-details"
                    heading="Inquiry"
                    submitLabel="Inquiry"
                    defaultMessage={`Hello, I am interested in ${selectedAgency.name}.`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <FooterCta
          title={toStringValue(pageContent?.cta_title, "Start your journey as a retailer.")}
          buttonLabel={toStringValue(pageContent?.cta_button_label, "Get Started")}
          buttonLink={toStringValue(pageContent?.cta_button_link, "/contact")}
        />
      </MarketingShell>
    );
  }

  return (
    <MarketingShell>
      <BannerTwo title={title} subtitle={subtitle} currentLabel={title} />

      <div className="agency-section mt-130 xl-mt-100 mb-150 xl-mb-100">
        <div className="container">
          <div className="listing-header-filter d-sm-flex justify-content-between align-items-center mb-35">
            <div>
              Showing <span className="color-dark fw-500">{agencies.length}</span> agencies
            </div>
            <div className="d-flex align-items-center xs-mt-20">
              <div className="short-filter d-flex align-items-center">
                <div className="fs-16 me-2">Sort by:</div>
                <select className="nice-select rounded-0" defaultValue="popular">
                  <option value="popular">Popular</option>
                  <option value="listings">Most Listings</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>
          </div>

          {!agentsResponse.ok ? (
            <div className="alert alert-danger mb-35">
              {agentsResponse.message ?? "Unable to load agency data right now."}
            </div>
          ) : null}

          <div className="row gx-xxl-5">
            {agencies.map((agency, index) => {
              const rating = (4 + Math.min(agency.listingCount / 60, 1)).toFixed(1);
              const address = [agency.city, agency.state, agency.country].filter(Boolean).join(", ");

              return (
                <div className="col-lg-4 col-sm-6" key={`agency-card-${agency.slug}`}>
                  <div className="card-style-nine position-relative z-1 mb-50 lg-mb-30 wow fadeInUp" data-wow-delay={`${(index % 3) * 0.1}s`}>
                    <div className="tag bg-white position-absolute text-uppercase">{agency.listingCount} Listing</div>
                    <div className="logo-wrapper d-flex align-items-center justify-content-center">
                      <h4 className="m0">{agency.name.slice(0, 2).toUpperCase()}</h4>
                    </div>
                    <div className="text-center pt-35">
                      <h6 className="agency-name">{agency.name}</h6>
                      <ul className="rating style-none d-flex justify-content-center align-items-center">
                        {Array.from({ length: 5 }).map((_, starIndex) => (
                          <li key={`agency-star-${agency.slug}-${starIndex}`}><i className="fa-sharp fa-solid fa-star"></i></li>
                        ))}
                        <li><span>{rating}</span></li>
                      </ul>
                      <p>{address || "Location not available"}</p>
                      <a href={detailsLink} className="btn-eight w-100 rounded-0 tran3s">View Listing</a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <FooterCta
        title={toStringValue(pageContent?.cta_title, "Start your journey as a retailer.")}
        buttonLabel={toStringValue(pageContent?.cta_button_label, "Get Started")}
        buttonLink={toStringValue(pageContent?.cta_button_link, "/contact")}
      />
    </MarketingShell>
  );
}

function UnknownMarketingTemplatePage({
  pageTitle,
  routePath,
}: DynamicMarketingTemplatePageProps) {
  return (
    <MarketingShell>
      <BannerOne
        title={pageTitle ?? "Page"}
        subtitle="This template key is not mapped yet."
        currentLabel={pageTitle ?? "Page"}
      />
      <div className="container mt-80 mb-120">
        <div className="alert alert-warning">
          Unknown template mapping for route <strong>{routePath}</strong>. Assign a supported template in Page Studio.
        </div>
      </div>
    </MarketingShell>
  );
}

export async function DynamicMarketingTemplatePage(props: DynamicMarketingTemplatePageProps) {
  const family = resolveMarketingTemplateFamily(props.templateKey);

  if (family === "about") {
    return AboutTemplatePage(props);
  }

  if (family === "contact") {
    return ContactTemplatePage(props);
  }

  if (family === "faq") {
    return FaqTemplatePage(props);
  }

  if (family === "pricing") {
    return PricingTemplatePage(props);
  }

  if (family === "project") {
    return ProjectTemplatePage(props);
  }

  if (family === "service") {
    return ServiceTemplatePage(props);
  }

  if (family === "agency") {
    return AgencyTemplatePage(props);
  }

  return UnknownMarketingTemplatePage(props);
}

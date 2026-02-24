import Link from "next/link";
import { notFound } from "next/navigation";
import { TemplatePageShell } from "@/components/template-page-shell";
import { LoginModal } from "@/features/shared/login-modal";
import { ScrollTopButton } from "@/features/shared/scroll-top";
import { cmsThemeScripts } from "@/features/cms/cms-theme-scripts";
import { getBackendBaseUrl } from "@/lib/api-base";
import { fetchPublicProperties, fetchPublicProperty, type PublicProperty } from "@/lib/public-api";

type DynamicPropertyDetailsPageProps = {
  listRoutePath: string;
  propertySlug: string;
  templateKey?: string;
  pageContent?: Record<string, unknown>;
};

function toStringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
}

function toIntegerValue(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function toNumberValue(value: unknown, fallback: number): number {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBooleanValue(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["1", "true", "yes", "on"].includes(value.toLowerCase());
  }

  return fallback;
}

function toTitleLabel(value: string | null | undefined, fallback: string) {
  if (!value || value.trim() === "") {
    return fallback;
  }

  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function parsePrice(rawPrice: string | number): number | null {
  const price = typeof rawPrice === "number" ? rawPrice : Number.parseFloat(rawPrice);
  return Number.isFinite(price) ? price : null;
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

function formatDate(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function estimateMonthlyPayment(price: number, downPaymentPercent: number, annualRate: number, years: number): number {
  const principal = price * (1 - downPaymentPercent);
  const monthlyRate = annualRate / 12;
  const totalPayments = years * 12;

  if (totalPayments <= 0) {
    return 0;
  }

  if (monthlyRate === 0) {
    return principal / totalPayments;
  }

  return principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalPayments));
}

function listingTagLabel(listingType: string) {
  return listingType === "rent" ? "FOR RENT" : "FOR SELL";
}

function listingStatusLabel(listingType: string) {
  return listingType === "rent" ? "For Rent" : "For Sale";
}

function propertyAddress(property: PublicProperty) {
  return [property.address_line, property.city, property.state, property.country]
    .filter((segment): segment is string => typeof segment === "string" && segment.trim() !== "")
    .join(", ");
}

function normalizeFeatures(features: unknown[] | undefined) {
  if (!Array.isArray(features)) {
    return [];
  }

  return features
    .map((feature) => {
      if (typeof feature === "string") {
        return toTitleLabel(feature, "");
      }

      if (feature && typeof feature === "object") {
        const value = feature as Record<string, unknown>;

        if (typeof value.label === "string") {
          return toTitleLabel(value.label, "");
        }

        if (typeof value.name === "string") {
          return toTitleLabel(value.name, "");
        }
      }

      return "";
    })
    .filter((feature) => feature !== "");
}

function propertyImageSources(property: PublicProperty) {
  if (Array.isArray(property.images) && property.images.length > 0) {
    return property.images.map((image, index) => ({
      id: image.id ?? index,
      path: image.path,
      altText: image.alt_text ?? property.title,
    }));
  }

  return [
    {
      id: property.id,
      path: property.primary_image?.path ?? "/images/listing/img_01.jpg",
      altText: property.primary_image?.alt_text ?? property.title,
    },
  ];
}

function detailPath(basePath: string, slug: string) {
  const normalizedBase = basePath === "/" ? "" : basePath.replace(/\/+$/, "");
  return `${normalizedBase}/${slug}`;
}

function resolveDetailTemplate(templateKey: string | undefined, pageContent?: Record<string, unknown>) {
  const contentTemplate = toStringValue(pageContent?.details_template_key, "");

  if (/^listing_details_\d+$/i.test(contentTemplate)) {
    return contentTemplate.toLowerCase();
  }

  if (templateKey && /^listing_details_\d+$/i.test(templateKey)) {
    return templateKey.toLowerCase();
  }

  return "listing_details_01";
}

function buildAgentName(property: PublicProperty) {
  if (property.agent?.full_name && property.agent.full_name.trim() !== "") {
    return property.agent.full_name;
  }

  const parts = [property.agent?.first_name, property.agent?.last_name]
    .filter((part): part is string => typeof part === "string" && part.trim() !== "")
    .join(" ");

  return parts !== "" ? parts : "Property Agent";
}

export async function DynamicPropertyDetailsPage({
  listRoutePath,
  propertySlug,
  templateKey,
  pageContent,
}: DynamicPropertyDetailsPageProps) {
  const [propertyResponse, featuredResponse] = await Promise.all([
    fetchPublicProperty(propertySlug),
    fetchPublicProperties({
      per_page: 6,
      featured: true,
      sort: "newest",
    }),
  ]);

  const property = propertyResponse.data;

  if (!propertyResponse.ok || !property) {
    notFound();
  }

  const detailTemplate = resolveDetailTemplate(templateKey, pageContent);
  const useTemplateTwo = detailTemplate === "listing_details_02";
  const showVideo = useTemplateTwo && toBooleanValue(pageContent?.details_video_enabled, true);
  const videoUrl = toStringValue(pageContent?.details_video_url, "https://creativegigstf.com/video/intro_4.mp4");
  const images = propertyImageSources(property);
  const features = normalizeFeatures(property.features);
  const amenities = features.length > 0
    ? features
    : ["A/C & Heating", "Garages", "Swimming Pool", "Parking", "Garden", "Pet Friendly"];
  const listPath = listRoutePath === "" ? "/" : listRoutePath;
  const featuredProperties = (featuredResponse.data ?? [])
    .filter((item) => item.slug !== property.slug)
    .slice(0, 3);

  const title = property.title;
  const address = propertyAddress(property);
  const listingType = listingStatusLabel(property.listing_type);
  const priceNumber = parsePrice(property.price);
  const downPaymentPercent = Math.min(Math.max(toNumberValue(pageContent?.mortgage_down_payment_percent, 20), 0), 95) / 100;
  const annualInterestRate = Math.min(Math.max(toNumberValue(pageContent?.mortgage_interest_rate, 3.5), 0), 100) / 100;
  const loanYears = Math.max(toIntegerValue(pageContent?.mortgage_loan_years, 30), 1);
  const monthlyPayment = priceNumber === null
    ? null
    : estimateMonthlyPayment(priceNumber, downPaymentPercent, annualInterestRate, loanYears);
  const propertyTypeLabel = toTitleLabel(property.property_type, "Property");
  const kitchenCount = toIntegerValue(pageContent?.default_kitchens, 1);
  const mediaSliderId = `media_slider_${property.id}`;
  const accordionId = `accordion_${property.id}`;
  const detailCollapseId = `collapseOne_${property.id}`;
  const utilityCollapseId = `collapseTwo_${property.id}`;
  const outdoorCollapseId = `collapseThree_${property.id}`;
  const featuredCarouselId = `featured_listing_${property.id}`;

  const agentName = buildAgentName(property);
  const agentLocation = toStringValue(pageContent?.agent_location, `${property.city}, ${property.country}`);
  const agentEmail = toStringValue(pageContent?.agent_email, "hello@homerealestate.com");
  const agentPhone = toStringValue(pageContent?.agent_phone, "+1 (555) 123-9876");
  const contactLink = toStringValue(pageContent?.contact_link, "/contact");

  const inquiryEndpoint = `${getBackendBaseUrl()}/api/v1/inquiries`;

  const overviewRows: Array<[string, string]> = [
    ["Bedrooms", String(property.bedrooms ?? "-")],
    ["Bathrooms", String(property.bathrooms ?? "-")],
    ["Area", `${property.area_sqft ?? "-"} sqft`],
    ["Property Type", propertyTypeLabel],
    ["Status", listingType],
    ["City", property.city],
    ["State", property.state ?? "-"],
    ["Country", property.country],
    ["Postal Code", property.postal_code ?? "-"],
    ["Featured", property.is_featured ? "Yes" : "No"],
  ];

  const utilityRows: Array<[string, string]> = [
    ["Published", formatDate(property.published_at) || "-"],
    ["Price", formatPrice(property.price)],
    ["Listing Type", listingType],
    ["Latitude", property.latitude ?? "-"],
    ["Longitude", property.longitude ?? "-"],
    ["Loan Term", `${loanYears} years`],
  ];

  const outdoorRows: Array<[string, string]> = amenities.slice(0, 8).map((feature) => [feature, "Yes"]);

  const detailsHeader = (
    <div className="row">
      <div className="col-lg-6">
        <h3 className="property-titlee">{title}</h3>
        <div className="d-flex flex-wrap mt-10">
          <div className={`list-type text-uppercase border-20 mt-15 me-3 ${property.listing_type === "sale" ? "sale" : ""}`}>
            {listingTagLabel(property.listing_type)}
          </div>
          <div className="address mt-15"><i className="bi bi-geo-alt"></i> {address}</div>
        </div>
      </div>
      <div className="col-lg-6 text-lg-end">
        <div className="d-inline-block md-mt-40">
          <div className="price color-dark fw-500">Price: {formatPrice(property.price)}</div>
          <div className="est-price fs-20 mt-25 mb-35 md-mb-30">
            Est. Payment <span className="fw-500 color-dark">{monthlyPayment === null ? "N/A" : `${formatPrice(monthlyPayment)}/mo*`}</span>
          </div>
          <ul className="style-none d-flex align-items-center action-btns">
            <li className="me-auto fw-500 color-dark"><i className="fa-sharp fa-regular fa-share-nodes me-2"></i> Share</li>
            <li><a href="#" className="d-flex align-items-center justify-content-center rounded-circle tran3s"><i className="fa-light fa-heart"></i></a></li>
            <li><a href="#" className="d-flex align-items-center justify-content-center rounded-circle tran3s"><i className="fa-light fa-bookmark"></i></a></li>
            <li><a href="#" className="d-flex align-items-center justify-content-center rounded-circle tran3s"><i className="fa-light fa-circle-plus"></i></a></li>
          </ul>
        </div>
      </div>
    </div>
  );

  const featureOverviewClassName = useTemplateTwo
    ? "property-feature-list border-top mt-70 lg-mt-50 pt-60 lg-pt-30 pb-30 lg-pb-10"
    : "property-feature-list bg-white shadow4 border-20 p-40 mt-50 mb-60";

  const featureOverviewBlock = (
    <div className={featureOverviewClassName}>
      {!useTemplateTwo ? <h4 className="sub-title-one mb-40 lg-mb-20">Property Overview</h4> : null}
      <ul className="style-none d-flex flex-wrap align-items-center justify-content-between">
        <li>
          <img src="/images/lazy.svg" data-src="/images/icon/icon_47.svg" alt="" className="lazy-img icon" />
          <span className="fs-20 color-dark">Sqft . {property.area_sqft ?? "-"}</span>
        </li>
        <li>
          <img src="/images/lazy.svg" data-src="/images/icon/icon_48.svg" alt="" className="lazy-img icon" />
          <span className="fs-20 color-dark">Bed . {property.bedrooms ?? "-"}</span>
        </li>
        <li>
          <img src="/images/lazy.svg" data-src="/images/icon/icon_49.svg" alt="" className="lazy-img icon" />
          <span className="fs-20 color-dark">Bath . {property.bathrooms ?? "-"}</span>
        </li>
        <li>
          <img src="/images/lazy.svg" data-src="/images/icon/icon_50.svg" alt="" className="lazy-img icon" />
          <span className="fs-20 color-dark">Kitchen . {String(kitchenCount).padStart(2, "0")}</span>
        </li>
        <li>
          <img src="/images/lazy.svg" data-src="/images/icon/icon_51.svg" alt="" className="lazy-img icon" />
          <span className="fs-20 color-dark">Type . {propertyTypeLabel}</span>
        </li>
      </ul>
    </div>
  );

  return (
    <TemplatePageShell scripts={cmsThemeScripts}>
      <div className="main-page-wrapper">
        <section className={`listing-details-one theme-details-one bg-pink ${useTemplateTwo ? "pt-120 lg-pt-100" : "pt-180 lg-pt-150"} pb-150 xl-pb-120`}>
          {showVideo ? (
            <div className="video-wrapper">
              <video preload="none" muted playsInline autoPlay loop>
                <source src={videoUrl} type="video/mp4" />
              </video>
            </div>
          ) : null}

          <div className="container">
            <div className="mb-35">
              <Link href={listPath} className="btn-three">
                <span>Back to Listings</span>
              </Link>
            </div>

            {useTemplateTwo ? (
              <div className="bg-white shadow4 border-20 p-40 mt-70 lg-mt-50 mb-60">
                {detailsHeader}
                {featureOverviewBlock}
              </div>
            ) : (
              <>
                {detailsHeader}

                <div className="media-gallery mt-100 xl-mt-80 lg-mt-60">
                  <div id={mediaSliderId} className="carousel slide row">
                    <div className="col-lg-10">
                      <div className="bg-white shadow4 border-20 p-30 md-mb-20">
                        <div className="position-relative z-1 overflow-hidden border-20">
                          <div className="img-fancy-btn border-10 fw-500 fs-16 color-dark">
                            See all {images.length} Photos
                            {images.map((image) => (
                              <a
                                key={image.id}
                                href={image.path}
                                className="d-block"
                                data-fancybox="mainImg"
                                data-caption={title}
                              ></a>
                            ))}
                          </div>
                          <div className="carousel-inner">
                            {images.map((image, imageIndex) => (
                              <div key={image.id} className={`carousel-item ${imageIndex === 0 ? "active" : ""}`}>
                                <img src={image.path} alt={image.altText} className="border-20 w-100" />
                              </div>
                            ))}
                          </div>
                          {images.length > 1 ? (
                            <>
                              <button className="carousel-control-prev" type="button" data-bs-target={`#${mediaSliderId}`} data-bs-slide="prev">
                                <i className="bi bi-chevron-left"></i>
                                <span className="visually-hidden">Previous</span>
                              </button>
                              <button className="carousel-control-next" type="button" data-bs-target={`#${mediaSliderId}`} data-bs-slide="next">
                                <i className="bi bi-chevron-right"></i>
                                <span className="visually-hidden">Next</span>
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-2">
                      <div className="carousel-indicators position-relative border-15 bg-white shadow4 p-15 w-100 h-100">
                        {images.slice(0, 4).map((image, imageIndex) => (
                          <button
                            key={image.id}
                            type="button"
                            data-bs-target={`#${mediaSliderId}`}
                            data-bs-slide-to={imageIndex}
                            className={imageIndex === 0 ? "active" : ""}
                            aria-current={imageIndex === 0 ? "true" : undefined}
                            aria-label={`Slide ${imageIndex + 1}`}
                          >
                            <img src={image.path} alt={image.altText} className="border-10 w-100" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {featureOverviewBlock}
              </>
            )}

            <div className="row">
              <div className="col-xl-8">
                <div className="property-overview bg-white shadow4 border-20 p-40 mb-50">
                  <h4 className="mb-20">Overview</h4>
                  <p className="fs-20 lh-lg">
                    {property.description ?? "No description has been published for this property yet."}
                  </p>
                </div>

                <div className="property-feature-accordion bg-white shadow4 border-20 p-40 mb-50">
                  <h4 className="mb-20">Property Features</h4>
                  <p className="fs-20 lh-lg">All key details are synced from your CMS-managed property records.</p>

                  <div className="accordion-style-two mt-45">
                    <div className="accordion" id={accordionId}>
                      <div className="accordion-item">
                        <h2 className="accordion-header">
                          <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target={`#${detailCollapseId}`} aria-expanded="true" aria-controls={detailCollapseId}>
                            Property Details
                          </button>
                        </h2>
                        <div id={detailCollapseId} className="accordion-collapse collapse show" data-bs-parent={`#${accordionId}`}>
                          <div className="accordion-body">
                            <div className="feature-list-two">
                              <ul className="style-none d-flex flex-wrap justify-content-between">
                                {overviewRows.map(([label, value]) => (
                                  <li key={label}><span>{`${label}: `}</span> <span className="fw-500 color-dark">{value}</span></li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="accordion-item">
                        <h2 className="accordion-header">
                          <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#${utilityCollapseId}`} aria-expanded="false" aria-controls={utilityCollapseId}>
                            Utility Details
                          </button>
                        </h2>
                        <div id={utilityCollapseId} className="accordion-collapse collapse" data-bs-parent={`#${accordionId}`}>
                          <div className="accordion-body">
                            <div className="feature-list-two">
                              <ul className="style-none d-flex flex-wrap justify-content-between">
                                {utilityRows.map(([label, value]) => (
                                  <li key={label}><span>{`${label}: `}</span> <span className="fw-500 color-dark">{value}</span></li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="accordion-item">
                        <h2 className="accordion-header">
                          <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#${outdoorCollapseId}`} aria-expanded="false" aria-controls={outdoorCollapseId}>
                            Outdoor Features
                          </button>
                        </h2>
                        <div id={outdoorCollapseId} className="accordion-collapse collapse" data-bs-parent={`#${accordionId}`}>
                          <div className="accordion-body">
                            <div className="feature-list-two">
                              <ul className="style-none d-flex flex-wrap justify-content-between">
                                {outdoorRows.map(([label, value]) => (
                                  <li key={label}><span>{`${label}: `}</span> <span className="fw-500 color-dark">{value}</span></li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="property-amenities bg-white shadow4 border-20 p-40 mb-50">
                  <h4 className="mb-20">Amenities</h4>
                  <p className="fs-20 lh-lg pb-25">Feature sets below are dynamic and manageable from the admin property editor.</p>
                  <ul className="style-none d-flex flex-wrap justify-content-between list-style-two">
                    {amenities.map((amenity) => (
                      <li key={amenity}>{amenity}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="col-xl-4 col-lg-8 me-auto ms-auto">
                <div className="theme-sidebar-one dot-bg p-30 ms-xxl-3 lg-mt-80">
                  <div className="agent-info bg-white border-20 p-30 mb-40">
                    <img src="/images/lazy.svg" data-src="/images/agent/img_06.jpg" alt="" className="lazy-img rounded-circle ms-auto me-auto mt-3 avatar" />
                    <div className="text-center mt-25">
                      <h6 className="name">{agentName}</h6>
                      <p className="fs-16">Property Agent & Broker</p>
                      <ul className="style-none d-flex align-items-center justify-content-center social-icon">
                        <li><a href="#"><i className="fa-brands fa-facebook-f"></i></a></li>
                        <li><a href="#"><i className="fa-brands fa-twitter"></i></a></li>
                        <li><a href="#"><i className="fa-brands fa-instagram"></i></a></li>
                        <li><a href="#"><i className="fa-brands fa-linkedin"></i></a></li>
                      </ul>
                    </div>
                    <div className="divider-line mt-40 mb-45 pt-20">
                      <ul className="style-none">
                        <li>Location: <span>{agentLocation}</span></li>
                        <li>Email: <span><a href={`mailto:${agentEmail}`}>{agentEmail}</a></span></li>
                        <li>Phone: <span><a href={`tel:${agentPhone.replace(/\s+/g, "")}`}>{agentPhone}</a></span></li>
                      </ul>
                    </div>

                    <Link href={contactLink} className="btn-nine text-uppercase rounded-3 w-100 mb-10">CONTACT AGENT</Link>
                  </div>

                  <div className="tour-schedule bg-white border-20 p-30 mb-40">
                    <h5 className="mb-40">Schedule Tour</h5>
                    <form action={inquiryEndpoint} method="post">
                      <input type="hidden" name="property_id" value={String(property.id)} />
                      <input type="hidden" name="source" value="listing-page" />

                      <div className="input-box-three mb-25">
                        <div className="label">Your Name*</div>
                        <input name="full_name" type="text" placeholder="Your full name" className="type-input" required />
                      </div>

                      <div className="input-box-three mb-25">
                        <div className="label">Your Email*</div>
                        <input name="email" type="email" placeholder="Enter mail address" className="type-input" required />
                      </div>

                      <div className="input-box-three mb-25">
                        <div className="label">Your Phone*</div>
                        <input name="phone" type="tel" placeholder="Your phone number" className="type-input" />
                      </div>

                      <div className="input-box-three mb-15">
                        <div className="label">Message*</div>
                        <textarea name="message" defaultValue={`Hello, I am interested in [${title}]`} required></textarea>
                      </div>

                      <button className="btn-nine text-uppercase rounded-3 w-100 mb-10" type="submit">INQUIRY</button>
                    </form>
                  </div>

                  <div className="mortgage-calculator bg-white border-20 p-30 mb-40">
                    <h5 className="mb-40">Mortgage Calculator</h5>
                    <form action="#">
                      <div className="input-box-three mb-25">
                        <div className="label">Home Price*</div>
                        <input type="text" defaultValue={priceNumber === null ? "" : Math.round(priceNumber).toLocaleString("en-US")} className="type-input" />
                      </div>

                      <div className="input-box-three mb-25">
                        <div className="label">Down Payment*</div>
                        <input type="text" defaultValue={`${Math.round(downPaymentPercent * 100)}%`} className="type-input" />
                      </div>

                      <div className="input-box-three mb-25">
                        <div className="label">Interest Rate*</div>
                        <input type="text" defaultValue={`${(annualInterestRate * 100).toFixed(2)}%`} className="type-input" />
                      </div>

                      <div className="input-box-three mb-25">
                        <div className="label">Loan Terms (Years)</div>
                        <input type="text" defaultValue={String(loanYears)} className="type-input" />
                      </div>

                      <button className="btn-five text-uppercase sm rounded-3 w-100 mb-10" type="button">CALCULATE</button>
                    </form>
                  </div>

                  <div className="feature-listing bg-white border-20 p-30">
                    <h5 className="mb-40">Featured Listing</h5>

                    {featuredProperties.length > 0 ? (
                      <div id={featuredCarouselId} className="carousel slide">
                        <div className="carousel-indicators">
                          {featuredProperties.map((featured, featuredIndex) => (
                            <button
                              key={featured.id}
                              type="button"
                              data-bs-target={`#${featuredCarouselId}`}
                              data-bs-slide-to={featuredIndex}
                              className={featuredIndex === 0 ? "active" : ""}
                              aria-current={featuredIndex === 0 ? "true" : undefined}
                              aria-label={`Slide ${featuredIndex + 1}`}
                            ></button>
                          ))}
                        </div>
                        <div className="carousel-inner">
                          {featuredProperties.map((featured, featuredIndex) => (
                            <div key={featured.id} className={`carousel-item ${featuredIndex === 0 ? "active" : ""}`}>
                              <div className="listing-card-one style-three border-10">
                                <div className="img-gallery">
                                  <div className="position-relative border-10 overflow-hidden">
                                    <div className="tag bg-white text-dark fw-500 border-20">{listingTagLabel(featured.listing_type)}</div>
                                    <img
                                      src={featured.primary_image?.path ?? "/images/listing/img_13.jpg"}
                                      className="w-100 border-10"
                                      alt={featured.primary_image?.alt_text ?? featured.title}
                                    />
                                  </div>
                                </div>

                                <div className="property-info mt-15">
                                  <div className="d-flex justify-content-between align-items-end">
                                    <div>
                                      <strong className="price fw-500 color-dark">{formatPrice(featured.price)}</strong>
                                      <div className="address m0 pt-5">{`${featured.address_line}, ${featured.city}`}</div>
                                    </div>
                                    <Link href={detailPath(listPath, featured.slug)} className="btn-four rounded-circle">
                                      <i className="bi bi-arrow-up-right"></i>
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="fs-16 m0">No featured properties available right now.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <LoginModal />
        <ScrollTopButton />
      </div>
    </TemplatePageShell>
  );
}

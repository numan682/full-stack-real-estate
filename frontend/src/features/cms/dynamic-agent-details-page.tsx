import Link from "next/link";
import { notFound } from "next/navigation";
import { TemplatePageShell } from "@/components/template-page-shell";
import { LoginModal } from "@/features/shared/login-modal";
import { ScrollTopButton } from "@/features/shared/scroll-top";
import { cmsThemeScripts } from "@/features/cms/cms-theme-scripts";
import { fetchPublicAgent } from "@/lib/public-api";

type DynamicAgentDetailsPageProps = {
  listRoutePath: string;
  agentSlug: string;
  pageContent?: Record<string, unknown>;
};

function toStringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
}

function toPhoneHref(phone: string) {
  const normalized = phone.replace(/[^\d+]/g, "");
  return normalized === "" ? "#" : `tel:${normalized}`;
}

function propertyDetailsPath(basePath: string, slug: string) {
  const normalized = basePath.trim();
  const prefix = normalized === "" || normalized === "/" ? "/properties" : normalized;
  const routeBase = prefix.replace(/\/+$/, "");
  return `${routeBase}/${slug}`;
}

function listingTagLabel(listingType: string) {
  return listingType === "rent" ? "FOR RENT" : "FOR SELL";
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

function resolveLocation(city?: string | null, state?: string | null, country?: string | null) {
  return [city, state, country]
    .filter((part): part is string => typeof part === "string" && part.trim() !== "")
    .join(", ");
}

export async function DynamicAgentDetailsPage({
  listRoutePath,
  agentSlug,
  pageContent,
}: DynamicAgentDetailsPageProps) {
  const response = await fetchPublicAgent(agentSlug);
  const agent = response.data;

  if (!response.ok || !agent) {
    notFound();
  }

  const avatarPath = toStringValue(agent.avatar_path, "/images/agent/img_01.jpg");
  const role = toStringValue(agent.position, "Property Agent");
  const agencyName = toStringValue(agent.agency?.name, "Home Real Estate");
  const location = resolveLocation(agent.agency?.city, agent.agency?.state, agent.agency?.country);
  const bio = toStringValue(
    agent.bio,
    "This agent profile is active and available for listing consultations and property tours.",
  );
  const listPath = listRoutePath === "" ? "/" : listRoutePath;
  const listingsPath = toStringValue(pageContent?.properties_path, "/properties");
  const properties = agent.properties ?? [];
  const contactButtonLabel = toStringValue(pageContent?.contact_button_label, "Contact Agent");

  return (
    <TemplatePageShell scripts={cmsThemeScripts}>
      <div className="main-page-wrapper">
        <section className="inner-banner-one inner-banner bg-pink text-center z-1 pt-160 lg-pt-130 pb-110 xl-pb-80 md-pb-60 position-relative">
          <div className="container">
            <h3 className="mb-20 xl-mb-15 pt-15">{agent.full_name}</h3>
            <p className="fs-22">{role}</p>
          </div>
          <img src="/images/lazy.svg" data-src="/images/assets/ils_07.svg" alt="" className="lazy-img shapes w-100 illustration" />
        </section>

        <section className="agent-details-one mt-120 xl-mt-90 pb-120 xl-pb-90">
          <div className="container">
            <div className="mb-35">
              <Link href={listPath} className="btn-three">
                <span>Back to Agents</span>
              </Link>
            </div>

            <div className="row">
              <div className="col-lg-4">
                <div className="agent-info bg-white border-20 p-30 mb-40">
                  <img src={avatarPath} alt={agent.full_name} className="rounded-circle ms-auto me-auto mt-3 avatar d-block" />
                  <div className="text-center mt-25">
                    <h6 className="name">{agent.full_name}</h6>
                    <p className="fs-16">{role}</p>
                  </div>
                  <div className="divider-line mt-30 mb-30 pt-15">
                    <ul className="style-none">
                      <li>Agency: <span>{agencyName}</span></li>
                      {location !== "" ? <li>Location: <span>{location}</span></li> : null}
                      <li>Email: <span><a href={`mailto:${agent.email}`}>{agent.email}</a></span></li>
                      {agent.phone ? <li>Phone: <span><a href={toPhoneHref(agent.phone)}>{agent.phone}</a></span></li> : null}
                      <li>Active Listings: <span>{String(agent.published_properties_count ?? properties.length ?? 0)}</span></li>
                    </ul>
                  </div>
                  <a href={`mailto:${agent.email}`} className="btn-nine text-uppercase rounded-3 w-100 mb-10">
                    {contactButtonLabel}
                  </a>
                </div>
              </div>

              <div className="col-lg-8">
                <div className="property-overview bg-white shadow4 border-20 p-40 mb-50">
                  <h4 className="mb-20">About {agent.first_name}</h4>
                  <p className="fs-20 lh-lg">{bio}</p>
                </div>

                <div className="property-listing-six bg-pink-two border-20 p-30">
                  <h4 className="mb-25">Active Listings by {agent.first_name}</h4>
                  <div className="row">
                    {properties.map((property, index) => (
                      <div className="col-md-6 d-flex mb-30 wow fadeInUp" data-wow-delay={`${(index % 4) * 0.1}s`} key={property.id}>
                        <div className="listing-card-one border-20 w-100">
                          <div className="img-gallery p-10">
                            <div className="position-relative border-15 overflow-hidden">
                              <div className={`tag border-25 ${property.listing_type === "sale" ? "sale" : ""}`}>
                                {listingTagLabel(property.listing_type)}
                              </div>
                              <Link href={propertyDetailsPath(listingsPath, property.slug)} className="d-block">
                                <img
                                  src={property.primary_image?.path ?? "/images/listing/img_01.jpg"}
                                  className="w-100"
                                  alt={property.primary_image?.alt_text ?? property.title}
                                />
                              </Link>
                            </div>
                          </div>
                          <div className="property-info p-20">
                            <Link href={propertyDetailsPath(listingsPath, property.slug)} className="title tran3s">
                              {property.title}
                            </Link>
                            <div className="address">{`${property.address_line}, ${property.city}`}</div>
                            <div className="pl-footer top-border d-flex align-items-center justify-content-between">
                              <strong className="price fw-500 color-dark">
                                {formatPrice(property.price)}
                                {property.listing_type === "rent" ? <sub>/m</sub> : null}
                              </strong>
                              <Link href={propertyDetailsPath(listingsPath, property.slug)} className="btn-four rounded-circle">
                                <i className="bi bi-arrow-up-right"></i>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {properties.length === 0 ? (
                    <p className="fs-18 m0">No active listings assigned to this agent right now.</p>
                  ) : null}
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

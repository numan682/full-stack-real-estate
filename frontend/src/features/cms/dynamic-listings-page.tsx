import Link from "next/link";
import { TemplatePageShell } from "@/components/template-page-shell";
import { LoginModal } from "@/features/shared/login-modal";
import { ScrollTopButton } from "@/features/shared/scroll-top";
import { cmsThemeScripts } from "@/features/cms/cms-theme-scripts";
import { fetchPublicProperties, type ApiPaginationMeta, type PublicProperty } from "@/lib/public-api";

type DynamicListingsPageProps = {
  routePath: string;
  templateKey: string;
  pageTitle?: string | null;
  pageContent?: Record<string, unknown>;
};

const LIST_TEMPLATE_NUMBERS = new Set([2, 4, 6, 8, 10, 12, 15, 17]);

function toStringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
}

function toIntegerValue(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
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

function toStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const normalized = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item !== "");

  return normalized.length > 0 ? normalized : fallback;
}

function toSortValue(value: unknown, fallback: "newest" | "price_asc" | "price_desc") {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "newest" || normalized === "price_asc" || normalized === "price_desc") {
    return normalized;
  }

  return fallback;
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

function propertyDetailsUrl(routePath: string, slug: string) {
  const normalizedBase = routePath === "/" ? "" : routePath.replace(/\/+$/, "");
  return `${normalizedBase}/${slug}`;
}

function listingTagLabel(listingType: string) {
  return listingType === "rent" ? "FOR RENT" : "FOR SELL";
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

function isListVariant(templateKey: string, pageContent?: Record<string, unknown>) {
  const layoutOverride = toStringValue(pageContent?.listing_layout, "");

  if (layoutOverride.toLowerCase() === "list") {
    return true;
  }

  if (layoutOverride.toLowerCase() === "grid") {
    return false;
  }

  const templateMatch = /^listing_(\d+)$/i.exec(templateKey);
  if (!templateMatch) {
    return false;
  }

  const templateNumber = Number.parseInt(templateMatch[1], 10);
  return LIST_TEMPLATE_NUMBERS.has(templateNumber);
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

function formatRange(meta: ApiPaginationMeta | undefined, itemCount: number) {
  if (!meta || itemCount === 0) {
    return {
      start: 0,
      end: 0,
      total: meta?.total ?? 0,
    };
  }

  const start = (meta.current_page - 1) * meta.per_page + 1;
  const end = start + itemCount - 1;

  return {
    start,
    end,
    total: meta.total,
  };
}

function sortLabel(sort: "newest" | "price_asc" | "price_desc") {
  if (sort === "price_asc") {
    return "Price Low";
  }

  if (sort === "price_desc") {
    return "Price High";
  }

  return "Newest";
}

function sidebarCityOptions(properties: PublicProperty[]) {
  return Array.from(
    new Set(
      properties
        .map((property) => property.city?.trim() ?? "")
        .filter((city) => city !== ""),
    ),
  ).slice(0, 7);
}

function GridCard({
  property,
  routePath,
  index,
}: {
  property: PublicProperty;
  routePath: string;
  index: number;
}) {
  const detailsPath = propertyDetailsUrl(routePath, property.slug);
  const images = propertyImageSources(property);
  const carouselId = `listing-grid-carousel-${property.id}`;
  const delay = `${(index % 4) * 0.1}s`;

  return (
    <div className="col-md-6 d-flex mb-50 wow fadeInUp" data-wow-delay={delay}>
      <div className="listing-card-one border-25 h-100 w-100">
        <div className="img-gallery p-15">
          <div className="position-relative border-25 overflow-hidden">
            <div className={`tag border-25 ${property.listing_type === "sale" ? "sale" : ""}`}>
              {listingTagLabel(property.listing_type)}
            </div>

            {images.length > 1 ? (
              <div id={carouselId} className="carousel slide">
                <div className="carousel-indicators">
                  {images.map((image, imageIndex) => (
                    <button
                      key={image.id}
                      type="button"
                      data-bs-target={`#${carouselId}`}
                      data-bs-slide-to={imageIndex}
                      className={imageIndex === 0 ? "active" : ""}
                      aria-current={imageIndex === 0 ? "true" : undefined}
                      aria-label={`Slide ${imageIndex + 1}`}
                    />
                  ))}
                </div>
                <div className="carousel-inner">
                  {images.map((image, imageIndex) => (
                    <div
                      key={image.id}
                      className={`carousel-item ${imageIndex === 0 ? "active" : ""}`}
                      data-bs-interval="1000000"
                    >
                      <Link href={detailsPath} className="d-block">
                        <img src={image.path} className="w-100" alt={image.altText} />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Link href={detailsPath} className="d-block">
                <img src={images[0].path} className="w-100" alt={images[0].altText} />
              </Link>
            )}
          </div>
        </div>

        <div className="property-info p-25">
          <Link href={detailsPath} className="title tran3s">
            {property.title}
          </Link>
          <div className="address">{`${property.address_line}, ${property.city}`}</div>
          <ul className="style-none feature d-flex flex-wrap align-items-center justify-content-between">
            <li className="d-flex align-items-center">
              <img src="/images/lazy.svg" data-src="/images/icon/icon_04.svg" alt="" className="lazy-img icon me-2" />
              <span className="fs-16">{property.area_sqft ?? "-"} sqft</span>
            </li>
            <li className="d-flex align-items-center">
              <img src="/images/lazy.svg" data-src="/images/icon/icon_05.svg" alt="" className="lazy-img icon me-2" />
              <span className="fs-16">{property.bedrooms ?? "-"} bed</span>
            </li>
            <li className="d-flex align-items-center">
              <img src="/images/lazy.svg" data-src="/images/icon/icon_06.svg" alt="" className="lazy-img icon me-2" />
              <span className="fs-16">{property.bathrooms ?? "-"} bath</span>
            </li>
          </ul>
          <div className="pl-footer top-border d-flex align-items-center justify-content-between">
            <strong className="price fw-500 color-dark">
              {formatPrice(property.price)}
              {property.listing_type === "rent" ? <sub>/m</sub> : null}
            </strong>
            <Link href={detailsPath} className="btn-four rounded-circle">
              <i className="bi bi-arrow-up-right"></i>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListCard({
  property,
  routePath,
  index,
}: {
  property: PublicProperty;
  routePath: string;
  index: number;
}) {
  const detailsPath = propertyDetailsUrl(routePath, property.slug);
  const images = propertyImageSources(property);
  const primaryImage = images[0];
  const delay = `${(index % 4) * 0.1}s`;

  return (
    <div className="listing-card-seven border-20 p-20 mb-50 wow fadeInUp" data-wow-delay={delay}>
      <div className="d-flex flex-wrap layout-one">
        <div
          className="img-gallery position-relative z-1 border-20 overflow-hidden"
          style={{ backgroundImage: `url(${primaryImage.path})` }}
        >
          <div className={`tag border-20 ${property.listing_type === "sale" ? "sale" : ""}`}>
            {listingTagLabel(property.listing_type)}
          </div>
          <div className="img-slider-btn">
            {String(images.length).padStart(2, "0")} <i className="fa-regular fa-image"></i>
            {images.slice(0, 4).map((image) => (
              <a
                key={image.id}
                href={image.path}
                className="d-block"
                data-fancybox={`property-${property.id}`}
                data-caption={property.title}
              ></a>
            ))}
          </div>
        </div>

        <div className="property-info">
          <Link href={detailsPath} className="title tran3s mb-15">
            {property.title}
          </Link>
          <div className="address">{`${property.address_line}, ${property.city}, ${property.country}`}</div>
          <div className="feature mt-30 mb-30 pt-30 pb-5">
            <ul className="style-none d-flex flex-wrap align-items-center justify-content-between">
              <li><strong>{property.area_sqft ?? "-"}</strong> sqft</li>
              <li><strong>{property.bedrooms ?? "-"}</strong> bed</li>
              <li><strong>{property.bathrooms ?? "-"}</strong> bath</li>
              <li><strong>{toTitleLabel(property.property_type, "-")}</strong> type</li>
            </ul>
          </div>
          <div className="pl-footer d-flex flex-wrap align-items-center justify-content-between">
            <strong className="price fw-500 color-dark me-auto">
              {formatPrice(property.price)}
              {property.listing_type === "rent" ? <sub>/m</sub> : null}
            </strong>
            <ul className="style-none d-flex action-icons me-4">
              <li><a href="#"><i className="fa-light fa-heart"></i></a></li>
              <li><a href="#"><i className="fa-light fa-bookmark"></i></a></li>
              <li><a href="#"><i className="fa-light fa-circle-plus"></i></a></li>
            </ul>
            <Link href={detailsPath} className="btn-four rounded-circle">
              <i className="bi bi-arrow-up-right"></i>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function DynamicListingsPage({
  routePath,
  templateKey,
  pageTitle,
  pageContent,
}: DynamicListingsPageProps) {
  const title = toStringValue(pageContent?.hero_title, pageTitle ?? "Property Listings");
  const subtitle = toStringValue(
    pageContent?.hero_subtitle,
    "Browse the latest available properties managed from your admin portal.",
  );
  const emptyMessage = toStringValue(
    pageContent?.empty_message,
    "No published properties found yet. Add and publish listings from Admin.",
  );
  const sidebarTitle = toStringValue(pageContent?.sidebar_title, "Advanced Search");
  const listingLabel = toStringValue(pageContent?.listing_label, "I'm looking to...");
  const perPage = toIntegerValue(pageContent?.per_page, 12);
  const featuredOnly = toBooleanValue(pageContent?.featured_only, false);
  const sort = toSortValue(pageContent?.sort, "newest");
  const listVariant = isListVariant(templateKey, pageContent);
  const amenities = toStringArray(pageContent?.sidebar_amenities, [
    "A/C & Heating",
    "Garages",
    "Garden",
    "Disabled Access",
    "Swimming Pool",
    "Parking",
    "Wifi",
    "Pet Friendly",
    "Ceiling Height",
    "Fireplace",
    "Play Ground",
    "Elevator",
  ]);

  const response = await fetchPublicProperties({
    per_page: perPage,
    sort,
    ...(featuredOnly ? { featured: true } : {}),
  });
  const properties = response.data ?? [];
  const range = formatRange(response.meta, properties.length);
  const cities = sidebarCityOptions(properties);

  return (
    <TemplatePageShell scripts={cmsThemeScripts}>
      <div className="main-page-wrapper">
        <section className="inner-banner-one inner-banner bg-pink text-center z-1 pt-160 lg-pt-130 pb-110 xl-pb-80 md-pb-60 position-relative">
          <div className="container">
            <h3 className="mb-20 xl-mb-15 pt-15">{title}</h3>
            <p className="fs-22">{subtitle}</p>
          </div>
          <img src="/images/lazy.svg" data-src="/images/assets/ils_07.svg" alt="" className="lazy-img shapes w-100 illustration" />
        </section>

        <section className="property-listing-six bg-pink-two pt-110 md-pt-80 pb-150 xl-pb-120 mt-150 xl-mt-120">
          <div className="container container-large">
            {!response.ok ? (
              <div className="alert alert-danger mb-30">
                {response.message ?? "Unable to load properties at this moment."}
              </div>
            ) : null}

            <div className="row">
              <div className="col-lg-8">
                <div className="ps-xxl-5">
                  <div className="listing-header-filter d-sm-flex justify-content-between align-items-center mb-40 lg-mb-30">
                    <div>
                      Showing <span className="color-dark fw-500">{`${range.start}-${range.end}`}</span> of{" "}
                      <span className="color-dark fw-500">{range.total.toLocaleString("en-US")}</span> results
                    </div>
                    <div className="d-flex align-items-center xs-mt-20">
                      <div className="short-filter d-flex align-items-center">
                        <div className="fs-16 me-2">Short by:</div>
                        <select className="nice-select" defaultValue={sort}>
                          <option value="newest">Newest</option>
                          <option value="price_asc">Price Low</option>
                          <option value="price_desc">Price High</option>
                        </select>
                      </div>
                      <span
                        className="tran3s layout-change rounded-circle ms-auto ms-sm-3 d-flex align-items-center justify-content-center"
                        title={listVariant ? "List View" : "Grid View"}
                      >
                        <i className={`fa-regular ${listVariant ? "fa-bars" : "fa-grid-2"}`}></i>
                      </span>
                    </div>
                  </div>

                  {listVariant ? (
                    <div>
                      {properties.map((property, index) => (
                        <ListCard property={property} routePath={routePath} index={index} key={property.id} />
                      ))}
                    </div>
                  ) : (
                    <div className="row gx-xxl-5">
                      {properties.map((property, index) => (
                        <GridCard property={property} routePath={routePath} index={index} key={property.id} />
                      ))}
                    </div>
                  )}

                  {properties.length === 0 ? (
                    <div className="text-center mt-60">
                      <p className="fs-20">{emptyMessage}</p>
                    </div>
                  ) : null}

                  {response.meta && response.meta.last_page > 1 ? (
                    <ul className="pagination-one d-flex align-items-center justify-content-center justify-content-sm-start style-none pt-30">
                      {Array.from({ length: Math.min(response.meta.last_page, 4) }, (_, pageIndex) => pageIndex + 1).map((page) => (
                        <li key={page} className={page === response.meta?.current_page ? "active" : ""}>
                          <span>{page}</span>
                        </li>
                      ))}
                      {response.meta.last_page > 4 ? <li>....</li> : null}
                      <li className="ms-2">
                        <span className="d-flex align-items-center">
                          Last <img src="/images/icon/icon_46.svg" alt="" className="ms-2" />
                        </span>
                      </li>
                    </ul>
                  ) : null}
                </div>
              </div>

              <div className="col-lg-4 order-lg-first">
                <div className="advance-search-panel dot-bg md-mt-80">
                  <div className="main-bg">
                    <form action="#">
                      <div className="row gx-lg-5">
                        <div className="col-12">
                          <h5 className="mb-35">{sidebarTitle}</h5>
                        </div>
                        <div className="col-12">
                          <div className="input-box-one mb-35">
                            <div className="label">{listingLabel}</div>
                            <select className="nice-select fw-normal" defaultValue={featuredOnly ? "featured" : "all"}>
                              <option value="all">All Listings</option>
                              <option value="sale">For Sale</option>
                              <option value="rent">For Rent</option>
                              <option value="featured">Featured</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="input-box-one mb-35">
                            <div className="label">Keyword</div>
                            <input type="text" placeholder="buy, home, loft, apartment" className="type-input" />
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="input-box-one mb-50">
                            <div className="label">Location</div>
                            <select className="nice-select location fw-normal" defaultValue="all">
                              <option value="all">All Locations</option>
                              {cities.map((city) => (
                                <option key={city} value={city}>{city}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-sm-6">
                          <div className="input-box-one mb-40">
                            <div className="label">Bedroom</div>
                            <select className="nice-select fw-normal" defaultValue="0">
                              <option value="0">Any</option>
                              <option value="1">1+</option>
                              <option value="2">2+</option>
                              <option value="3">3+</option>
                              <option value="4">4+</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-sm-6">
                          <div className="input-box-one mb-40">
                            <div className="label">Bath</div>
                            <select className="nice-select fw-normal" defaultValue="0">
                              <option value="0">Any</option>
                              <option value="1">1+</option>
                              <option value="2">2+</option>
                              <option value="3">3+</option>
                              <option value="4">4+</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-12">
                          <h6 className="block-title fw-bold mb-30">Amenities</h6>
                          <ul className="style-none d-flex flex-wrap justify-content-between filter-input">
                            {amenities.map((amenity, amenityIndex) => (
                              <li key={amenity}>
                                <input type="checkbox" name="Amenities" value={String(amenityIndex + 1)} />
                                <label>{amenity}</label>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="col-12">
                          <button type="button" className="fw-500 text-uppercase tran3s apply-search w-100 mt-40 mb-25">
                            <i className="fa-light fa-magnifying-glass"></i>
                            <span>Search</span>
                          </button>
                        </div>
                        <div className="col-12">
                          <div className="d-flex justify-content-between form-widget">
                            <a href="#" className="tran3s">
                              <i className="fa-regular fa-arrows-rotate"></i>
                              <span>Reset Filter</span>
                            </a>
                            <a href="#" className="tran3s">
                              <i className="fa-regular fa-star"></i>
                              <span>{`Sort: ${sortLabel(sort)}`}</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </form>
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

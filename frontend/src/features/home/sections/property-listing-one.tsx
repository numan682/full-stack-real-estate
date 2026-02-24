/* eslint-disable */

"use client";

import { useEffect, useMemo, useState } from "react";
import { getBackendBaseUrl } from "@/lib/api-base";

type HomeListingSectionProps = {
  content?: Record<string, unknown>;
};

type HomeProperty = {
  id: number;
  title: string;
  slug: string;
  listing_type: "sale" | "rent";
  price: string | number;
  address_line: string;
  city: string;
  area_sqft?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  primary_image?: {
    path?: string | null;
    alt_text?: string | null;
  } | null;
};

function toStringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
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

function toIntegerValue(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
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

function listingTypeLabel(listingType: string) {
  return listingType === "rent" ? "FOR RENT" : "FOR SELL";
}

export function PropertyListingOneSection({ content }: HomeListingSectionProps) {
  const [properties, setProperties] = useState<HomeProperty[]>([]);
  const [error, setError] = useState<string | null>(null);

  const headline = toStringValue(content?.headline, "New Listings");
  const subtitle = toStringValue(content?.subtitle, "Explore latest & featured properties for sale.");
  const emptyMessage = toStringValue(content?.empty_message, "No listings available yet.");
  const ctaLabel = toStringValue(content?.cta_label, "Explore All");
  const ctaLink = toStringValue(content?.cta_link, "/properties");
  const perPage = toIntegerValue(content?.per_page, 6);
  const featuredOnly = toBooleanValue(content?.featured_only, false);

  const queryUrl = useMemo(() => {
    const params = new URLSearchParams({
      per_page: String(perPage),
      sort: "newest",
    });

    if (featuredOnly) {
      params.set("featured", "true");
    }

    return `${getBackendBaseUrl()}/api/v1/properties?${params.toString()}`;
  }, [featuredOnly, perPage]);

  useEffect(() => {
    let isMounted = true;

    async function loadProperties() {
      try {
        const response = await fetch(queryUrl, { cache: "no-store" });
        const payload = await response.json() as { data?: HomeProperty[]; message?: string };

        if (!response.ok) {
          if (isMounted) {
            setError(payload?.message ?? "Unable to load listings.");
            setProperties([]);
          }

          return;
        }

        if (isMounted) {
          setError(null);
          setProperties(Array.isArray(payload?.data) ? payload.data : []);
        }
      } catch {
        if (isMounted) {
          setError("Unable to load listings.");
          setProperties([]);
        }
      }
    }

    loadProperties();

    return () => {
      isMounted = false;
    };
  }, [queryUrl]);

  return (
    <div className="property-listing-one bg-pink-two mt-150 xl-mt-120 pt-140 xl-pt-120 lg-pt-80 pb-180 xl-pb-120 lg-pb-100">
      <div className="container">
        <div className="position-relative">
          <div className="title-one text-center text-lg-start mb-45 xl-mb-30 lg-mb-20 wow fadeInUp">
            <h3>{headline}</h3>
            <p className="fs-22 mt-xs">{subtitle}</p>
          </div>

          {error ? (
            <div className="alert alert-danger mb-30">{error}</div>
          ) : null}

          <div className="row gx-xxl-5">
            {properties.map((property, index) => (
              <div
                className="col-lg-4 col-md-6 d-flex mt-40 wow fadeInUp"
                data-wow-delay={`${(index % 3) * 0.1}s`}
                key={property.id}
              >
                <div className="listing-card-one border-25 h-100 w-100">
                  <div className="img-gallery p-15">
                    <div className="position-relative border-25 overflow-hidden">
                      <div className={`tag border-25 ${property.listing_type === "sale" ? "sale" : ""}`}>
                        {listingTypeLabel(property.listing_type)}
                      </div>
                      <a href={`/properties/${property.slug}`} className="d-block">
                        <img
                          src={property.primary_image?.path ?? "/images/listing/img_01.jpg"}
                          className="w-100"
                          alt={property.primary_image?.alt_text ?? property.title}
                        />
                      </a>
                    </div>
                  </div>

                  <div className="property-info p-25">
                    <a href={`/properties/${property.slug}`} className="title tran3s">
                      {property.title}
                    </a>
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
                      <strong className="price fw-500 color-dark">{formatPrice(property.price)}</strong>
                      <a href={`/properties/${property.slug}`} className="btn-four rounded-circle">
                        <i className="bi bi-arrow-up-right"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {properties.length === 0 ? (
            <div className="text-center mt-60">
              <p className="fs-20">{emptyMessage}</p>
            </div>
          ) : null}

          <div className="section-btn text-center md-mt-60">
            <a href={ctaLink} className="btn-five">{ctaLabel}</a>
          </div>
        </div>
      </div>
    </div>
  );
}

import type { AdminAgent, AdminProperty } from "@/lib/admin/types";

export const PROPERTY_FEATURE_OPTIONS = [
  "Air Conditioning",
  "Swimming Pool",
  "Gym",
  "Balcony",
  "Elevator",
  "Parking",
  "Pet Friendly",
  "Garden",
  "Security",
  "Fireplace",
  "Laundry Room",
  "Smart Home",
] as const;

const IMAGE_SLOT_COUNT = 6;

type PropertyFormFieldsProps = {
  agents: AdminAgent[];
  property?: AdminProperty;
};

function normalizeFeatures(features: AdminProperty["features"] | undefined) {
  if (!Array.isArray(features)) {
    return [];
  }

  return features
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item !== "");
}

export function PropertyFormFields({ agents, property }: PropertyFormFieldsProps) {
  const normalizedFeatures = normalizeFeatures(property?.features);
  const selectedFeatures = new Set(normalizedFeatures);
  const customFeatures = normalizedFeatures.filter(
    (feature) => !PROPERTY_FEATURE_OPTIONS.includes(feature as (typeof PROPERTY_FEATURE_OPTIONS)[number]),
  );

  const images = property?.images ?? [];
  const primaryImageIndex = images.findIndex((image) => image.is_primary);
  const primarySlot = primaryImageIndex >= 0 ? primaryImageIndex + 1 : images.length > 0 ? 1 : "";
  const imageSlotCount = Math.max(IMAGE_SLOT_COUNT, images.length);

  return (
    <div className="admin-form-shell">
      <section className="admin-form-section">
        <h3>Property Basics</h3>
        <p>Core property identity and listing state.</p>

        <div className="admin-row">
          <div className="admin-field" style={{ gridColumn: "span 6" }}>
            <label htmlFor="title">Title</label>
            <input id="title" name="title" defaultValue={property?.title ?? ""} required />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 3" }}>
            <label htmlFor="slug">Slug (Optional)</label>
            <input id="slug" name="slug" defaultValue={property?.slug ?? ""} placeholder="auto-generated-if-empty" />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 3" }}>
            <label htmlFor="property_type">Property Type</label>
            <input id="property_type" name="property_type" defaultValue={property?.property_type ?? "Apartment"} />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 3" }}>
            <label htmlFor="listing_type">Listing Type</label>
            <select id="listing_type" name="listing_type" defaultValue={property?.listing_type ?? "sale"}>
              <option value="sale">Sale</option>
              <option value="rent">Rent</option>
            </select>
          </div>

          <div className="admin-field" style={{ gridColumn: "span 3" }}>
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={property?.status ?? "draft"}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="admin-field" style={{ gridColumn: "span 3" }}>
            <label htmlFor="agent_id">Assigned Agent</label>
            <select id="agent_id" name="agent_id" defaultValue={property?.agent_id ?? ""}>
              <option value="">Unassigned</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {`${agent.full_name} (${agent.email})${agent.is_active ? "" : " - inactive"}`}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-field" style={{ gridColumn: "span 3" }}>
            <label htmlFor="price">Price</label>
            <input
              id="price"
              name="price"
              type="number"
              min={0}
              step="0.01"
              defaultValue={property?.price ?? ""}
              required
            />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 2" }}>
            <label htmlFor="bedrooms">Bedrooms</label>
            <input id="bedrooms" name="bedrooms" type="number" min={0} defaultValue={property?.bedrooms ?? ""} />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 2" }}>
            <label htmlFor="bathrooms">Bathrooms</label>
            <input id="bathrooms" name="bathrooms" type="number" min={0} defaultValue={property?.bathrooms ?? ""} />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 2" }}>
            <label htmlFor="area_sqft">Area (sqft)</label>
            <input id="area_sqft" name="area_sqft" type="number" min={0} defaultValue={property?.area_sqft ?? ""} />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 3" }}>
            <label htmlFor="is_featured">
              <input id="is_featured" name="is_featured" type="checkbox" defaultChecked={property?.is_featured ?? false} /> Mark as featured
            </label>
          </div>
        </div>
      </section>

      <section className="admin-form-section">
        <h3>Location</h3>
        <p>Address and map coordinates used in listing details.</p>

        <div className="admin-row">
          <div className="admin-field" style={{ gridColumn: "span 8" }}>
            <label htmlFor="address_line">Address</label>
            <input id="address_line" name="address_line" defaultValue={property?.address_line ?? ""} required />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 4" }}>
            <label htmlFor="city">City</label>
            <input id="city" name="city" defaultValue={property?.city ?? ""} required />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 4" }}>
            <label htmlFor="state">State</label>
            <input id="state" name="state" defaultValue={property?.state ?? ""} />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 4" }}>
            <label htmlFor="postal_code">Postal Code</label>
            <input id="postal_code" name="postal_code" defaultValue={property?.postal_code ?? ""} />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 4" }}>
            <label htmlFor="country">Country</label>
            <input id="country" name="country" defaultValue={property?.country ?? "United States"} />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 6" }}>
            <label htmlFor="latitude">Latitude</label>
            <input id="latitude" name="latitude" type="number" step="0.0000001" defaultValue={property?.latitude ?? ""} />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 6" }}>
            <label htmlFor="longitude">Longitude</label>
            <input id="longitude" name="longitude" type="number" step="0.0000001" defaultValue={property?.longitude ?? ""} />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 12" }}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              defaultValue={property?.description ?? ""}
              placeholder="Property highlights, neighborhood details, and amenities."
            />
          </div>
        </div>
      </section>

      <section className="admin-form-section">
        <h3>Features</h3>
        <p>Choose common amenities and add custom features when needed.</p>

        <div className="admin-choice-grid">
          {PROPERTY_FEATURE_OPTIONS.map((feature) => (
            <label key={feature} className="admin-choice-card">
              <input
                type="checkbox"
                name="feature_values"
                value={feature}
                defaultChecked={selectedFeatures.has(feature)}
              />
              <span>{feature}</span>
            </label>
          ))}
        </div>

        <div className="admin-row" style={{ marginTop: 12 }}>
          <div className="admin-field" style={{ gridColumn: "span 12" }}>
            <label htmlFor="feature_custom">Additional Features (one per line)</label>
            <textarea
              id="feature_custom"
              name="feature_custom"
              defaultValue={customFeatures.join("\n")}
              placeholder={"Rooftop lounge\nPrivate storage\nWaterfront view"}
            />
          </div>
        </div>
      </section>

      <section className="admin-form-section">
        <h3>Images</h3>
        <p>Use consistent image dimensions for all listings. Empty slots are ignored.</p>
        <input type="hidden" name="image_slot_count" value={imageSlotCount} />

        <div className="admin-image-grid">
          {Array.from({ length: imageSlotCount }).map((_, index) => {
            const slot = index + 1;
            const image = images[index];

            return (
              <div className="admin-image-slot" key={slot}>
                <h4>Image {slot}</h4>
                <div className="admin-field">
                  <label htmlFor={`image_path_${slot}`}>Image Path</label>
                  <input
                    id={`image_path_${slot}`}
                    name={`image_path_${slot}`}
                    defaultValue={image?.path ?? ""}
                    placeholder="/images/listings/property_01.jpg"
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor={`image_alt_${slot}`}>Alt Text</label>
                  <input
                    id={`image_alt_${slot}`}
                    name={`image_alt_${slot}`}
                    defaultValue={image?.alt_text ?? ""}
                    placeholder="Living room with modern furniture"
                  />
                </div>
                <label className="admin-radio">
                  <input
                    type="radio"
                    name="primary_image_slot"
                    value={slot}
                    defaultChecked={String(primarySlot) === String(slot)}
                  />
                  Set as primary image
                </label>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

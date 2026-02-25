import Link from "next/link";
import { fetchCmsConfig } from "@/lib/cms-api";
import { requirePortalUser } from "@/lib/portal/auth";
import { fetchAgentProperty } from "@/lib/portal/backend-client";
import { PortalShell } from "@/app/(site)/portal/portal-shell";
import { updateAgentPropertyAction } from "@/app/(site)/portal/agent/properties/[propertyId]/actions";

type AgentPropertyEditPageProps = {
  params: Promise<{
    propertyId: string;
  }>;
  searchParams: Promise<{
    status?: string;
    error?: string;
  }>;
};

export default async function AgentPropertyEditPage({ params, searchParams }: AgentPropertyEditPageProps) {
  const resolvedParams = await params;
  const query = await searchParams;
  const propertyId = Number.parseInt(resolvedParams.propertyId, 10);
  const [cmsConfig, user] = await Promise.all([
    fetchCmsConfig(),
    requirePortalUser(["agent"]),
  ]);

  if (!Number.isInteger(propertyId) || propertyId < 1) {
    return (
      <PortalShell
        cmsConfig={cmsConfig}
        title="Edit Listing"
        subtitle="Update your listing details."
        user={user}
      >
        <div className="admin-flash error" style={{ marginTop: 14 }}>Invalid property id.</div>
      </PortalShell>
    );
  }

  const response = await fetchAgentProperty(propertyId);

  if (!response.ok || !response.data) {
    return (
      <PortalShell
        cmsConfig={cmsConfig}
        title="Edit Listing"
        subtitle="Update your listing details."
        user={user}
      >
        <div className="admin-flash error" style={{ marginTop: 14 }}>
          {response.message ?? "Failed to load listing."}
        </div>
      </PortalShell>
    );
  }

  const property = response.data;

  return (
    <PortalShell
      cmsConfig={cmsConfig}
      title={`Edit Listing #${property.id}`}
      subtitle="Only your own listings are available in this portal."
      user={user}
    >
      <div className="admin-actions" style={{ marginTop: 14, marginBottom: 14 }}>
        <Link className="admin-btn secondary" href="/portal/agent">Back to Agent Portal</Link>
      </div>

      {query.status === "property-updated" ? (
        <div className="admin-flash">Listing updated successfully.</div>
      ) : null}
      {query.error ? (
        <div className="admin-flash error">{query.error}</div>
      ) : null}

      <div className="admin-card" style={{ marginTop: 14 }}>
        <form action={updateAgentPropertyAction}>
          <input type="hidden" name="property_id" value={property.id} />

          <div className="admin-row">
            <div className="admin-field" style={{ gridColumn: "span 6" }}>
              <label htmlFor="title">Title</label>
              <input id="title" name="title" defaultValue={property.title} required />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="slug">Slug</label>
              <input id="slug" name="slug" defaultValue={property.slug} />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="property_type">Property Type</label>
              <input id="property_type" name="property_type" defaultValue={property.property_type} />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="listing_type">Listing Type</label>
              <select id="listing_type" name="listing_type" defaultValue={property.listing_type}>
                <option value="sale">Sale</option>
                <option value="rent">Rent</option>
              </select>
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue={property.status}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="price">Price</label>
              <input id="price" name="price" type="number" min={0} step="0.01" defaultValue={property.price} required />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="area_sqft">Area (sqft)</label>
              <input id="area_sqft" name="area_sqft" type="number" min={0} defaultValue={property.area_sqft ?? ""} />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 2" }}>
              <label htmlFor="bedrooms">Bedrooms</label>
              <input id="bedrooms" name="bedrooms" type="number" min={0} defaultValue={property.bedrooms ?? ""} />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 2" }}>
              <label htmlFor="bathrooms">Bathrooms</label>
              <input id="bathrooms" name="bathrooms" type="number" min={0} defaultValue={property.bathrooms ?? ""} />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 8" }}>
              <label htmlFor="address_line">Address</label>
              <input id="address_line" name="address_line" defaultValue={property.address_line} required />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 4" }}>
              <label htmlFor="city">City</label>
              <input id="city" name="city" defaultValue={property.city} required />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 4" }}>
              <label htmlFor="state">State</label>
              <input id="state" name="state" defaultValue={property.state ?? ""} />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 4" }}>
              <label htmlFor="postal_code">Postal Code</label>
              <input id="postal_code" name="postal_code" defaultValue={property.postal_code ?? ""} />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 4" }}>
              <label htmlFor="country">Country</label>
              <input id="country" name="country" defaultValue={property.country} />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 4" }}>
              <label htmlFor="latitude">Latitude</label>
              <input id="latitude" name="latitude" type="number" step="0.0000001" defaultValue={property.latitude ?? ""} />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 4" }}>
              <label htmlFor="longitude">Longitude</label>
              <input id="longitude" name="longitude" type="number" step="0.0000001" defaultValue={property.longitude ?? ""} />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 12" }}>
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" defaultValue={property.description ?? ""} />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 6" }}>
              <label htmlFor="features_json">Features (JSON Array)</label>
              <textarea
                id="features_json"
                name="features_json"
                defaultValue={JSON.stringify(property.features ?? [], null, 2)}
              />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 6" }}>
              <label htmlFor="images_json">Images (JSON Array)</label>
              <textarea
                id="images_json"
                name="images_json"
                defaultValue={JSON.stringify(
                  (property.images ?? []).map((image) => ({
                    path: image.path,
                    alt_text: image.alt_text ?? "",
                    sort_order: image.sort_order,
                    is_primary: image.is_primary,
                  })),
                  null,
                  2,
                )}
              />
            </div>
          </div>

          <div className="admin-actions" style={{ marginTop: 10 }}>
            <button className="admin-btn" type="submit">Save Changes</button>
          </div>
        </form>
      </div>
    </PortalShell>
  );
}

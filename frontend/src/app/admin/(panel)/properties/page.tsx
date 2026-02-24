import Link from "next/link";
import { createPropertyAction, deletePropertyAction } from "@/app/admin/(panel)/properties/actions";
import { fetchAdminProperties } from "@/lib/admin/backend-client";

type PropertiesPageProps = {
  searchParams: Promise<{
    status?: string;
    error?: string;
    search?: string;
    status_filter?: string;
  }>;
};

function statusMessage(status?: string) {
  if (status === "property-created") {
    return "Property created successfully.";
  }

  if (status === "property-deleted") {
    return "Property deleted successfully.";
  }

  if (status === "property-updated") {
    return "Property updated successfully.";
  }

  return null;
}

export default async function AdminPropertiesPage({ searchParams }: PropertiesPageProps) {
  const query = await searchParams;
  const queryString = new URLSearchParams();

  if (query.search) {
    queryString.set("search", query.search);
  }

  if (query.status_filter) {
    queryString.set("status", query.status_filter);
  }

  queryString.set("per_page", "30");

  const response = await fetchAdminProperties(queryString.toString());
  const properties = response.data?.data ?? [];
  const status = statusMessage(query.status);

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2 className="admin-title">Properties</h2>
          <p className="admin-subtitle">Manage inventory and publishing status.</p>
        </div>
      </div>

      {status ? <div className="admin-flash">{status}</div> : null}
      {query.error ? <div className="admin-flash error">{query.error}</div> : null}

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>Create Property</h3>
        <form action={createPropertyAction}>
          <div className="admin-row">
            <div className="admin-field" style={{ gridColumn: "span 6" }}>
              <label htmlFor="title">Title</label>
              <input id="title" name="title" required />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="property_type">Property Type</label>
              <input id="property_type" name="property_type" defaultValue="Apartment" />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="listing_type">Listing Type</label>
              <select id="listing_type" name="listing_type" defaultValue="sale">
                <option value="sale">Sale</option>
                <option value="rent">Rent</option>
              </select>
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue="draft">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="price">Price</label>
              <input id="price" name="price" type="number" min={0} step="0.01" required />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="bedrooms">Bedrooms</label>
              <input id="bedrooms" name="bedrooms" type="number" min={0} />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="bathrooms">Bathrooms</label>
              <input id="bathrooms" name="bathrooms" type="number" min={0} />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 8" }}>
              <label htmlFor="address_line">Address</label>
              <input id="address_line" name="address_line" required />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 4" }}>
              <label htmlFor="city">City</label>
              <input id="city" name="city" required />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="state">State</label>
              <input id="state" name="state" />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="postal_code">Postal Code</label>
              <input id="postal_code" name="postal_code" />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="country">Country</label>
              <input id="country" name="country" defaultValue="United States" />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 3" }}>
              <label htmlFor="area_sqft">Area (sqft)</label>
              <input id="area_sqft" name="area_sqft" type="number" min={0} />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 9" }}>
              <label htmlFor="features_json">Features (JSON Array)</label>
              <textarea id="features_json" name="features_json" defaultValue={"[]"} />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 12" }}>
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" />
            </div>

            <div className="admin-field" style={{ gridColumn: "span 12" }}>
              <label htmlFor="is_featured">
                <input id="is_featured" name="is_featured" type="checkbox" /> Mark as featured
              </label>
            </div>
          </div>

          <div className="admin-actions" style={{ marginTop: 10 }}>
            <button className="admin-btn" type="submit">Create Property</button>
          </div>
        </form>
      </div>

      <div className="admin-card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Property List</h3>
        {!response.ok ? (
          <div className="admin-flash error">{response.message ?? "Failed to load properties."}</div>
        ) : null}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Price</th>
                <th>City</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.id}>
                  <td>{property.id}</td>
                  <td>{property.title}</td>
                  <td>{property.listing_type} / {property.property_type}</td>
                  <td>{property.status}</td>
                  <td>{property.price}</td>
                  <td>{property.city}</td>
                  <td>{property.updated_at ? new Date(property.updated_at).toLocaleString() : "-"}</td>
                  <td>
                    <div className="admin-actions">
                      <Link className="admin-btn secondary" href={`/admin/properties/${property.id}`}>
                        Edit
                      </Link>
                      <form action={deletePropertyAction}>
                        <input type="hidden" name="property_id" value={property.id} />
                        <button className="admin-btn danger" type="submit">Delete</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={8}>No properties found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

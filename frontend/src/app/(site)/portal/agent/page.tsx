import Link from "next/link";
import { fetchCmsConfig } from "@/lib/cms-api";
import { requirePortalUser } from "@/lib/portal/auth";
import { fetchAgentInquiries, fetchAgentProperties } from "@/lib/portal/backend-client";
import { PortalShell } from "@/app/(site)/portal/portal-shell";
import {
  createAgentPropertyAction,
  updateAgentInquiryStatusAction,
} from "@/app/(site)/portal/agent/actions";

type AgentPortalPageProps = {
  searchParams: Promise<{
    status?: string;
    error?: string;
  }>;
};

function statusMessage(status?: string) {
  if (status === "property-created") {
    return "Listing created successfully.";
  }

  if (status === "property-updated") {
    return "Listing updated successfully.";
  }

  if (status === "ticket-updated") {
    return "Ticket status updated successfully.";
  }

  return null;
}

export default async function AgentPortalPage({ searchParams }: AgentPortalPageProps) {
  const query = await searchParams;
  const [cmsConfig, user, propertyResponse, inquiryResponse] = await Promise.all([
    fetchCmsConfig(),
    requirePortalUser(["agent"]),
    fetchAgentProperties("per_page=30"),
    fetchAgentInquiries("per_page=40"),
  ]);

  const properties = propertyResponse.data?.data ?? [];
  const inquiries = inquiryResponse.data?.data ?? [];
  const activeListings = properties.filter((property) => property.status === "published").length;
  const pendingTickets = inquiries.filter((inquiry) => inquiry.status === "new").length;
  const status = statusMessage(query.status);

  return (
    <PortalShell
      cmsConfig={cmsConfig}
      title="Agent Portal"
      subtitle="Manage your listings and tour schedule tickets."
      user={user}
    >
      {status ? <div className="admin-flash" style={{ marginTop: 14 }}>{status}</div> : null}
      {query.error ? <div className="admin-flash error" style={{ marginTop: 14 }}>{query.error}</div> : null}

      <div className="admin-grid-cards" style={{ marginTop: 16 }}>
        <div className="admin-stat">
          <p className="label">Your Listings</p>
          <p className="value">{properties.length}</p>
        </div>
        <div className="admin-stat">
          <p className="label">Published</p>
          <p className="value">{activeListings}</p>
        </div>
        <div className="admin-stat">
          <p className="label">Tour Tickets</p>
          <p className="value">{inquiries.length}</p>
        </div>
        <div className="admin-stat">
          <p className="label">Need Follow-up</p>
          <p className="value">{pendingTickets}</p>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Add Listing</h3>
        <form action={createAgentPropertyAction}>
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
            <div className="admin-field" style={{ gridColumn: "span 8" }}>
              <label htmlFor="primary_image_path">Primary Image URL</label>
              <input
                id="primary_image_path"
                name="primary_image_path"
                placeholder="/images/listing/img_01.jpg"
              />
            </div>
            <div className="admin-field" style={{ gridColumn: "span 4" }}>
              <label htmlFor="primary_image_alt">Primary Image Alt</label>
              <input id="primary_image_alt" name="primary_image_alt" />
            </div>
            <div className="admin-field" style={{ gridColumn: "span 12" }}>
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" />
            </div>
          </div>

          <div className="admin-actions" style={{ marginTop: 10 }}>
            <button className="admin-btn" type="submit">Create Listing</button>
          </div>
        </form>
      </div>

      <div className="admin-card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>My Listings</h3>
        {!propertyResponse.ok ? (
          <div className="admin-flash error">{propertyResponse.message ?? "Failed to load listings."}</div>
        ) : null}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Status</th>
                <th>Type</th>
                <th>Price</th>
                <th>City</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.id}>
                  <td>{property.id}</td>
                  <td>{property.title}</td>
                  <td>{property.status}</td>
                  <td>{property.listing_type} / {property.property_type}</td>
                  <td>{property.price}</td>
                  <td>{property.city}</td>
                  <td>{property.updated_at ? new Date(property.updated_at).toLocaleString() : "-"}</td>
                  <td>
                    <Link href={`/portal/agent/properties/${property.id}`} className="admin-btn secondary">Edit</Link>
                  </td>
                </tr>
              ))}
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={8}>No listings found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Tour Schedule Tickets</h3>
        {!inquiryResponse.ok ? (
          <div className="admin-flash error">{inquiryResponse.message ?? "Failed to load tickets."}</div>
        ) : null}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Property</th>
                <th>Customer</th>
                <th>Message</th>
                <th>Status</th>
                <th>Created</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id}>
                  <td>{inquiry.id}</td>
                  <td>{inquiry.property?.title ?? "General"}</td>
                  <td>
                    {inquiry.full_name}
                    <br />
                    <small>{inquiry.email}</small>
                  </td>
                  <td>{inquiry.message}</td>
                  <td>
                    <span className={`admin-badge ${inquiry.status}`}>{inquiry.status}</span>
                  </td>
                  <td>{new Date(inquiry.created_at).toLocaleString()}</td>
                  <td>
                    <form action={updateAgentInquiryStatusAction} className="admin-actions">
                      <input type="hidden" name="inquiry_id" value={inquiry.id} />
                      <select name="status" defaultValue={inquiry.status}>
                        <option value="new">new</option>
                        <option value="contacted">contacted</option>
                        <option value="resolved">resolved</option>
                        <option value="spam">spam</option>
                      </select>
                      <button className="admin-btn secondary" type="submit">Save</button>
                    </form>
                  </td>
                </tr>
              ))}
              {inquiries.length === 0 ? (
                <tr>
                  <td colSpan={7}>No tour schedule tickets found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </PortalShell>
  );
}

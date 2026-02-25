import Link from "next/link";
import { deletePropertyAction } from "@/app/admin/(panel)/properties/actions";
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
        <div className="admin-actions">
          <Link className="admin-btn" href="/admin/properties/new">Add Property</Link>
        </div>
      </div>

      {status ? <div className="admin-flash">{status}</div> : null}
      {query.error ? <div className="admin-flash error">{query.error}</div> : null}
      <div className="admin-card">
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
                <th>Agent</th>
                <th>Price</th>
                <th>City</th>
                <th>Primary Image</th>
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
                  <td>{property.agent?.full_name ?? "Unassigned"}</td>
                  <td>{property.price}</td>
                  <td>{property.city}</td>
                  <td>{property.primary_image?.path ?? "-"}</td>
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
                  <td colSpan={10}>No properties found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

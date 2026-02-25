import Link from "next/link";
import { updatePropertyAction } from "@/app/admin/(panel)/properties/[propertyId]/actions";
import { PropertyFormFields } from "@/app/admin/(panel)/properties/property-form-fields";
import { fetchAdminAgents, fetchAdminProperty } from "@/lib/admin/backend-client";

type PropertyEditPageProps = {
  params: Promise<{
    propertyId: string;
  }>;
  searchParams: Promise<{
    status?: string;
    error?: string;
  }>;
};

export default async function PropertyEditPage({ params, searchParams }: PropertyEditPageProps) {
  const resolvedParams = await params;
  const query = await searchParams;
  const propertyId = Number.parseInt(resolvedParams.propertyId, 10);

  if (!Number.isInteger(propertyId) || propertyId < 1) {
    return (
      <section>
        <h2 className="admin-title">Edit Property</h2>
        <div className="admin-flash error">Invalid property id.</div>
      </section>
    );
  }

  const [response, agentsResponse] = await Promise.all([
    fetchAdminProperty(propertyId),
    fetchAdminAgents("limit=300"),
  ]);

  if (!response.ok || !response.data) {
    return (
      <section>
        <h2 className="admin-title">Edit Property</h2>
        <div className="admin-flash error">{response.message ?? "Failed to load property."}</div>
      </section>
    );
  }

  const property = response.data;
  const agents = agentsResponse.data ?? [];

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2 className="admin-title">Edit Property #{property.id}</h2>
          <p className="admin-subtitle">Update inventory, location, visual features, and listing images.</p>
        </div>
        <div className="admin-actions">
          <Link className="admin-btn secondary" href="/admin/properties">Back to Properties</Link>
        </div>
      </div>

      {query.status === "property-updated" ? (
        <div className="admin-flash">Property updated successfully.</div>
      ) : null}
      {query.error ? (
        <div className="admin-flash error">{query.error}</div>
      ) : null}
      {!agentsResponse.ok ? (
        <div className="admin-flash error">{agentsResponse.message ?? "Failed to load agents."}</div>
      ) : null}

      <div className="admin-card">
        <form action={updatePropertyAction}>
          <input type="hidden" name="property_id" value={property.id} />
          <PropertyFormFields agents={agents} property={property} />

          <div className="admin-actions" style={{ marginTop: 14 }}>
            <button className="admin-btn" type="submit">Save Changes</button>
          </div>
        </form>
      </div>
    </section>
  );
}

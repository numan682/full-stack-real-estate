import Link from "next/link";
import { createPropertyAction } from "@/app/admin/(panel)/properties/actions";
import { PropertyFormFields } from "@/app/admin/(panel)/properties/property-form-fields";
import { fetchAdminAgents } from "@/lib/admin/backend-client";

type NewPropertyPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewPropertyPage({ searchParams }: NewPropertyPageProps) {
  const query = await searchParams;
  const agentsResponse = await fetchAdminAgents("limit=300");
  const agents = agentsResponse.data ?? [];

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2 className="admin-title">Create Property</h2>
          <p className="admin-subtitle">Create a listing with visual fields, selected features, and image slots.</p>
        </div>
        <div className="admin-actions">
          <Link className="admin-btn secondary" href="/admin/properties">Back to Properties</Link>
        </div>
      </div>

      {query.error ? (
        <div className="admin-flash error">{query.error}</div>
      ) : null}
      {!agentsResponse.ok ? (
        <div className="admin-flash error">{agentsResponse.message ?? "Failed to load agents."}</div>
      ) : null}

      <div className="admin-card">
        <form action={createPropertyAction}>
          <PropertyFormFields agents={agents} />

          <div className="admin-actions" style={{ marginTop: 14 }}>
            <button className="admin-btn" type="submit">Create Property</button>
          </div>
        </form>
      </div>
    </section>
  );
}

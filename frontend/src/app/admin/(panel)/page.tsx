import { fetchAdminDashboard } from "@/lib/admin/backend-client";

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default async function AdminDashboardPage() {
  const response = await fetchAdminDashboard();

  if (!response.ok || !response.data) {
    return (
      <section>
        <h2 className="admin-title">Dashboard</h2>
        <div className="admin-flash error">{response.message ?? "Failed to load dashboard."}</div>
      </section>
    );
  }

  const { stats, recent_inquiries: recentInquiries, active_home_template: activeHomeTemplate } = response.data;

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2 className="admin-title">Dashboard</h2>
          <p className="admin-subtitle">Operational overview and latest inquiry activity.</p>
        </div>
      </div>

      <div className="admin-grid-cards">
        <div className="admin-stat">
          <p className="label">Properties</p>
          <p className="value">{stats.properties}</p>
        </div>
        <div className="admin-stat">
          <p className="label">Blogs</p>
          <p className="value">{stats.blogs}</p>
        </div>
        <div className="admin-stat">
          <p className="label">Agencies</p>
          <p className="value">{stats.agencies}</p>
        </div>
        <div className="admin-stat">
          <p className="label">Agents</p>
          <p className="value">{stats.agents}</p>
        </div>
        <div className="admin-stat">
          <p className="label">Inquiries</p>
          <p className="value">{stats.inquiries}</p>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: 14 }}>
        <strong>Active Home Template:</strong> {activeHomeTemplate}
      </div>

      <div className="admin-card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Recent Inquiries</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Property</th>
                <th>Status</th>
                <th>Source</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentInquiries.map((inquiry) => (
                <tr key={inquiry.id}>
                  <td>{inquiry.id}</td>
                  <td>{inquiry.full_name}</td>
                  <td>{inquiry.email}</td>
                  <td>{inquiry.property?.title ?? "-"}</td>
                  <td>
                    <span className={`admin-badge ${inquiry.status}`}>{inquiry.status}</span>
                  </td>
                  <td>{inquiry.source}</td>
                  <td>{formatDateTime(inquiry.created_at)}</td>
                </tr>
              ))}
              {recentInquiries.length === 0 ? (
                <tr>
                  <td colSpan={7}>No inquiries yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

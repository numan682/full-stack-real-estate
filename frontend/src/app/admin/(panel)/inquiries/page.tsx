import { updateInquiryStatusAction } from "@/app/admin/(panel)/inquiries/actions";
import { fetchAdminInquiries } from "@/lib/admin/backend-client";

type InquiriesPageProps = {
  searchParams: Promise<{
    status?: string;
    error?: string;
    status_filter?: string;
    search?: string;
  }>;
};

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default async function AdminInquiriesPage({ searchParams }: InquiriesPageProps) {
  const query = await searchParams;
  const queryString = new URLSearchParams();

  if (query.status_filter) {
    queryString.set("status", query.status_filter);
  }

  if (query.search) {
    queryString.set("search", query.search);
  }

  queryString.set("per_page", "40");

  const response = await fetchAdminInquiries(queryString.toString());
  const inquiries = response.data?.data ?? [];

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2 className="admin-title">Inquiries</h2>
          <p className="admin-subtitle">Track leads and update contact status in real time.</p>
        </div>
      </div>

      {query.status === "inquiry-updated" ? (
        <div className="admin-flash">Inquiry status updated.</div>
      ) : null}
      {query.error ? (
        <div className="admin-flash error">{query.error}</div>
      ) : null}

      {!response.ok ? (
        <div className="admin-flash error">{response.message ?? "Failed to load inquiries."}</div>
      ) : null}

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Property</th>
                <th>Message</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id}>
                  <td>{inquiry.id}</td>
                  <td>{inquiry.full_name}</td>
                  <td>{inquiry.email}</td>
                  <td>{inquiry.property?.title ?? "-"}</td>
                  <td style={{ maxWidth: 280, whiteSpace: "pre-wrap" }}>{inquiry.message}</td>
                  <td>
                    <form action={updateInquiryStatusAction} className="admin-actions">
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
                  <td>{formatDateTime(inquiry.created_at)}</td>
                </tr>
              ))}
              {inquiries.length === 0 ? (
                <tr>
                  <td colSpan={7}>No inquiries found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { deleteAgentAction } from "@/app/admin/(panel)/agents/actions";
import { fetchAdminAgents } from "@/lib/admin/backend-client";

type AgentsPageProps = {
  searchParams: Promise<{
    status?: string;
    error?: string;
    search?: string;
  }>;
};

function statusMessage(status?: string) {
  if (status === "agent-created") {
    return "Agent created successfully.";
  }

  if (status === "agent-updated") {
    return "Agent updated successfully.";
  }

  if (status === "agent-deleted") {
    return "Agent deleted successfully.";
  }

  return null;
}

export default async function AdminAgentsPage({ searchParams }: AgentsPageProps) {
  const query = await searchParams;
  const queryString = new URLSearchParams();

  if (query.search) {
    queryString.set("search", query.search);
  }
  queryString.set("limit", "300");

  const response = await fetchAdminAgents(queryString.toString());
  const agents = response.data ?? [];
  const status = statusMessage(query.status);

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2 className="admin-title">Agents</h2>
          <p className="admin-subtitle">Manage agent profiles and listing assignment data.</p>
        </div>
        <div className="admin-actions">
          <Link className="admin-btn" href="/admin/agents/new">Add Agent</Link>
        </div>
      </div>

      {status ? <div className="admin-flash">{status}</div> : null}
      {query.error ? <div className="admin-flash error">{query.error}</div> : null}

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>Agent Directory</h3>
        {!response.ok ? (
          <div className="admin-flash error">{response.message ?? "Failed to load agents."}</div>
        ) : null}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Position</th>
                <th>Agency</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id}>
                  <td>{agent.id}</td>
                  <td>{agent.full_name}</td>
                  <td>{agent.email}</td>
                  <td>{agent.phone ?? "-"}</td>
                  <td>{agent.position ?? "-"}</td>
                  <td>{agent.agency?.name ?? "-"}</td>
                  <td>{agent.is_active ? "Active" : "Inactive"}</td>
                  <td>{agent.updated_at ? new Date(agent.updated_at).toLocaleString() : "-"}</td>
                  <td>
                    <div className="admin-actions">
                      <Link className="admin-btn secondary" href={`/admin/agents/${agent.id}`}>
                        Edit
                      </Link>
                      <form action={deleteAgentAction}>
                        <input type="hidden" name="agent_id" value={agent.id} />
                        <button className="admin-btn danger" type="submit">Delete</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {agents.length === 0 ? (
                <tr>
                  <td colSpan={9}>No agents found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

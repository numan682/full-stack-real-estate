import Link from "next/link";
import { AgentFormFields } from "@/app/admin/(panel)/agents/agent-form-fields";
import { updateAgentAction } from "@/app/admin/(panel)/agents/[agentId]/actions";
import { fetchAdminAgent } from "@/lib/admin/backend-client";

type AgentEditPageProps = {
  params: Promise<{
    agentId: string;
  }>;
  searchParams: Promise<{
    status?: string;
    error?: string;
  }>;
};

export default async function AgentEditPage({ params, searchParams }: AgentEditPageProps) {
  const resolvedParams = await params;
  const query = await searchParams;
  const agentId = Number.parseInt(resolvedParams.agentId, 10);

  if (!Number.isInteger(agentId) || agentId < 1) {
    return (
      <section>
        <h2 className="admin-title">Edit Agent</h2>
        <div className="admin-flash error">Invalid agent id.</div>
      </section>
    );
  }

  const response = await fetchAdminAgent(agentId);
  if (!response.ok || !response.data) {
    return (
      <section>
        <h2 className="admin-title">Edit Agent</h2>
        <div className="admin-flash error">{response.message ?? "Failed to load agent."}</div>
      </section>
    );
  }

  const agent = response.data;

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2 className="admin-title">Edit Agent #{agent.id}</h2>
          <p className="admin-subtitle">Update profile details and visibility for public listing pages.</p>
        </div>
        <div className="admin-actions">
          <Link className="admin-btn secondary" href="/admin/agents">Back to Agents</Link>
        </div>
      </div>

      {query.status === "agent-updated" ? (
        <div className="admin-flash">Agent updated successfully.</div>
      ) : null}
      {query.error ? (
        <div className="admin-flash error">{query.error}</div>
      ) : null}

      <div className="admin-card">
        <form action={updateAgentAction}>
          <input type="hidden" name="agent_id" value={agent.id} />
          <AgentFormFields agent={agent} />

          <div className="admin-actions" style={{ marginTop: 14 }}>
            <button className="admin-btn" type="submit">Save Changes</button>
          </div>
        </form>
      </div>
    </section>
  );
}

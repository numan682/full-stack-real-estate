import Link from "next/link";
import { createAgentAction } from "@/app/admin/(panel)/agents/actions";
import { AgentFormFields } from "@/app/admin/(panel)/agents/agent-form-fields";

type NewAgentPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewAgentPage({ searchParams }: NewAgentPageProps) {
  const query = await searchParams;

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2 className="admin-title">Create Agent</h2>
          <p className="admin-subtitle">Add a new agent profile for dynamic listing assignment.</p>
        </div>
        <div className="admin-actions">
          <Link className="admin-btn secondary" href="/admin/agents">Back to Agents</Link>
        </div>
      </div>

      {query.error ? (
        <div className="admin-flash error">{query.error}</div>
      ) : null}

      <div className="admin-card">
        <form action={createAgentAction}>
          <AgentFormFields />

          <div className="admin-actions" style={{ marginTop: 14 }}>
            <button className="admin-btn" type="submit">Create Agent</button>
          </div>
        </form>
      </div>
    </section>
  );
}

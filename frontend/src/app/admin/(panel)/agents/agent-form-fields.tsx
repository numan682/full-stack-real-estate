import type { AdminAgent } from "@/lib/admin/types";

type AgentFormFieldsProps = {
  agent?: AdminAgent;
};

export function AgentFormFields({ agent }: AgentFormFieldsProps) {
  return (
    <div className="admin-form-shell">
      <section className="admin-form-section">
        <h3>Profile</h3>
        <p>Basic identity and contact details shown on listings and the public agents page.</p>
        <div className="admin-row">
          <div className="admin-field" style={{ gridColumn: "span 3" }}>
            <label htmlFor="first_name">First Name</label>
            <input id="first_name" name="first_name" defaultValue={agent?.first_name ?? ""} required />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 3" }}>
            <label htmlFor="last_name">Last Name</label>
            <input id="last_name" name="last_name" defaultValue={agent?.last_name ?? ""} required />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 6" }}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" defaultValue={agent?.email ?? ""} required />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 4" }}>
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" defaultValue={agent?.phone ?? ""} />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 4" }}>
            <label htmlFor="position">Position</label>
            <input id="position" name="position" defaultValue={agent?.position ?? ""} placeholder="Senior Property Agent" />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 4" }}>
            <label htmlFor="agency_id">Agency ID (Optional)</label>
            <input
              id="agency_id"
              name="agency_id"
              type="number"
              min={1}
              defaultValue={agent?.agency_id ?? ""}
              placeholder="e.g. 1"
            />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 12" }}>
            <label htmlFor="avatar_path">Avatar Image Path</label>
            <input
              id="avatar_path"
              name="avatar_path"
              defaultValue={agent?.avatar_path ?? ""}
              placeholder="/images/team/team_01.jpg"
            />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 12" }}>
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              defaultValue={agent?.bio ?? ""}
              placeholder="Short profile shown on agent cards and detail pages."
            />
          </div>

          <div className="admin-field" style={{ gridColumn: "span 12" }}>
            <label htmlFor="is_active">
              <input id="is_active" name="is_active" type="checkbox" defaultChecked={agent?.is_active ?? true} /> Active agent
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}

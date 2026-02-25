export type PortalRole = "admin" | "agent" | "customer";

export type PortalUser = {
  id: number;
  name: string;
  email: string;
  role: PortalRole;
  agent_id?: number | null;
};

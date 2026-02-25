import { redirect } from "next/navigation";
import { requirePortalUser } from "@/lib/portal/auth";

export default async function PortalIndexPage() {
  const user = await requirePortalUser();

  if (user.role === "admin") {
    redirect("/admin");
  }

  if (user.role === "agent") {
    redirect("/portal/agent");
  }

  redirect("/portal/customer");
}

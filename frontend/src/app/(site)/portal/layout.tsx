import type { ReactNode } from "react";
import "@/app/admin/admin.css";

type PortalLayoutProps = {
  children: ReactNode;
};

export default function PortalLayout({ children }: PortalLayoutProps) {
  return children;
}

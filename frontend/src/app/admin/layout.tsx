import type { ReactNode } from "react";
import "@/app/admin/admin.css";

type AdminRootLayoutProps = {
  children: ReactNode;
};

export default function AdminRootLayout({ children }: AdminRootLayoutProps) {
  return children;
}

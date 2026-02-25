import type { ReactNode } from "react";
import { ScrollReveal } from "@/features/shared/scroll-reveal";

type SiteLayoutProps = {
  children: ReactNode;
};

export default function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <>
      <ScrollReveal />
      {children}
    </>
  );
}

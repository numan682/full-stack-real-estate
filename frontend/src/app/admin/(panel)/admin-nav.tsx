"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/cms", label: "CMS Control" },
  { href: "/admin/properties", label: "Properties" },
  { href: "/admin/blogs", label: "Blogs" },
  { href: "/admin/inquiries", label: "Inquiries" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav">
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link key={link.href} href={link.href} className={isActive ? "active" : ""}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

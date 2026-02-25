import Link from "next/link";
import { cmsSubpages, type CmsSubpageKey } from "@/app/admin/(panel)/cms/shared";

type CmsSettingsNavProps = {
  active: CmsSubpageKey;
};

export function CmsSettingsNav({ active }: CmsSettingsNavProps) {
  return (
    <div className="admin-cms-subnav">
      {cmsSubpages.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`admin-cms-subnav-item ${item.key === active ? "active" : ""}`}
        >
          <span className="admin-cms-subnav-title">{item.label}</span>
          <span className="admin-cms-subnav-text">{item.description}</span>
        </Link>
      ))}
    </div>
  );
}

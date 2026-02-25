/* eslint-disable */

type SiteFooterContent = {
  address?: string;
  email?: string;
  copyright_text?: string;
};

type SiteBranding = {
  site_name?: string;
  logo_path?: string;
  logo_alt?: string;
};

type SiteNavigationItem = {
  pageKey: string;
  label: string;
  path: string;
  group?: string | null;
  order: number;
};

const fallbackLinks: SiteNavigationItem[] = [
  { pageKey: "about", label: "About", path: "/about_us_01", order: 20 },
  { pageKey: "properties", label: "Properties", path: "/properties", order: 30 },
  { pageKey: "agents", label: "Agents", path: "/agents", order: 40 },
  { pageKey: "blog", label: "Blog", path: "/blog", order: 50 },
  { pageKey: "contact", label: "Contact", path: "/contact", order: 60 },
];

const fallbackExploreLinks: SiteNavigationItem[] = [
  { pageKey: "buy-home", label: "Buy a Home", path: "/listing_01", order: 10 },
  { pageKey: "rent-home", label: "Rent a Home", path: "/listing_02", order: 20 },
  { pageKey: "new-listings", label: "New Listings", path: "/listing_03", order: 30 },
  { pageKey: "top-agents", label: "Top Agents", path: "/agents", order: 40 },
];

const fallbackSupportLinks: SiteNavigationItem[] = [
  { pageKey: "contact", label: "Contact Support", path: "/contact", order: 10 },
  { pageKey: "portal-login", label: "Portal Login", path: "/login", order: 20 },
  { pageKey: "customer-portal", label: "Customer Portal", path: "/portal/customer", order: 30 },
  { pageKey: "agent-portal", label: "Agent Portal", path: "/portal/agent", order: 40 },
];

function sortNavigationLinks(items: SiteNavigationItem[]) {
  return items
    .slice()
    .sort((first, second) => first.order - second.order);
}

function dedupeByPath(items: SiteNavigationItem[]) {
  const usedPaths = new Set<string>();
  return items.filter((item) => {
    if (usedPaths.has(item.path)) {
      return false;
    }

    usedPaths.add(item.path);
    return true;
  });
}

function pickByKeywords(items: SiteNavigationItem[], keywords: string[]) {
  const normalizedKeywords = keywords.map((keyword) => keyword.toLowerCase());

  return items.filter((item) => {
    const text = `${item.label} ${item.path} ${item.group ?? ""}`.toLowerCase();
    return normalizedKeywords.some((keyword) => text.includes(keyword));
  });
}

export function SiteFooter({
  content,
  branding,
  navigation,
}: {
  content?: SiteFooterContent;
  branding?: SiteBranding;
  navigation?: SiteNavigationItem[];
}) {
  const address = content?.address ?? "11910 Clyde Rapid Suite 70, Willyand, Virginia, United States";
  const email = content?.email ?? "hello@homerealestate.com";
  const copyrightText = content?.copyright_text ?? "Copyright @2026 Home Real Estate.";
  const siteName = branding?.site_name ?? "Home Real Estate";
  const logoPath = branding?.logo_path ?? "/images/logo/logo.svg";
  const logoAlt = branding?.logo_alt ?? siteName;
  const sortedNavigation = sortNavigationLinks(navigation && navigation.length > 0 ? navigation : fallbackLinks);

  const quickLinks = dedupeByPath(sortedNavigation)
    .filter((item) => item.path !== "/")
    .slice(0, 6);
  const exploreLinks = dedupeByPath(
    pickByKeywords(sortedNavigation, ["listing", "property", "rent", "sale", "agent"]),
  );
  const supportLinks = dedupeByPath(
    pickByKeywords(sortedNavigation, ["contact", "support", "portal", "login"]),
  );

  const displayExploreLinks = (exploreLinks.length > 0 ? exploreLinks : fallbackExploreLinks).slice(0, 6);
  const displaySupportLinks = (supportLinks.length > 0 ? supportLinks : fallbackSupportLinks).slice(0, 6);

  return (
    <div className="footer-one">
      <div className="position-relative z-1">
        <div className="container">
          <div className="row justify-content-between">
            <div className="col-lg-4">
              <div className="footer-intro">
                <div className="bg-wrapper">
                  <div className="logo mb-20">
                    <a href="/">
                      <img src={logoPath} alt={logoAlt} className="site-brand-logo" />
                    </a>
                  </div>

                  <p className="mb-20">{siteName}</p>
                  <p className="mb-60 lg-mb-40 md-mb-20">{address}</p>
                  <h6>CONTACT</h6>
                  <a href={`mailto:${email}`} className="email fs-24 text-decoration-underline tran3s mb-70 lg-mb-50">{email}</a>
                  <ul className="style-none d-flex align-items-center social-icon">
                    <li><a href="#"><i className="fa-brands fa-square-facebook"></i></a></li>
                    <li><a href="#"><i className="fa-brands fa-square-twitter"></i></a></li>
                    <li><a href="#"><i className="fa-brands fa-square-instagram"></i></a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-lg-8">
              <div className="footer-link-columns d-flex flex-wrap justify-content-between">
                <div className="footer-nav mt-100 lg-mt-80 xs-mt-50">
                  <h5 className="footer-title">Quick Links</h5>
                  <ul className="footer-nav-link style-none compact">
                    <li><a href="/">Home</a></li>
                    {quickLinks.map((item) => (
                      <li key={`quick-${item.pageKey}-${item.path}`}>
                        <a href={item.path}>{item.label}</a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="footer-nav mt-100 lg-mt-80 xs-mt-50">
                  <h5 className="footer-title">Explore</h5>
                  <ul className="footer-nav-link style-none compact">
                    {displayExploreLinks.map((item) => (
                      <li key={`explore-${item.pageKey}-${item.path}`}>
                        <a href={item.path}>{item.label}</a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="footer-nav mt-100 lg-mt-80 xs-mt-50">
                  <h5 className="footer-title">Support</h5>
                  <ul className="footer-nav-link style-none compact">
                    {displaySupportLinks.map((item) => (
                      <li key={`support-${item.pageKey}-${item.path}`}>
                        <a href={item.path}>{item.label}</a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="footer-help-card mt-100 lg-mt-80 xs-mt-50">
                  <h5 className="footer-title">Need Help Fast?</h5>
                  <p className="m0 pb-20">Talk to our team for tours, financing guidance, and matching listings.</p>
                  <a href="/contact" className="btn-nine text-uppercase rounded-3 w-100 mb-15">Get Consultation</a>
                  <a href={`mailto:${email}`} className="footer-help-email text-decoration-underline">{email}</a>
                </div>
              </div>
            </div>
          </div>

          <div className="bottom-footer pt-30 pb-10">
            <p className="m0 fs-16">{copyrightText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

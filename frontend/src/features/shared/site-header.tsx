/* eslint-disable */

type SiteHeaderContent = {
  announcement_text?: string;
  announcement_link?: string;
  home_nav_label?: string;
  login_label?: string;
  add_listing_label?: string;
  add_listing_link?: string;
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

const fallbackNavigation: SiteNavigationItem[] = [
  { pageKey: "about", label: "About", path: "/about_us_01", order: 20 },
  { pageKey: "properties", label: "Properties", path: "/properties", order: 30 },
  { pageKey: "agents", label: "Agents", path: "/agent", order: 40 },
  { pageKey: "blog", label: "Blog", path: "/blog", order: 50 },
  { pageKey: "contact", label: "Contact", path: "/contact", order: 60 },
];

export function SiteHeader({
  content,
  branding,
  navigation,
}: {
  content?: SiteHeaderContent;
  branding?: SiteBranding;
  navigation?: SiteNavigationItem[];
}) {
  const announcementText = content?.announcement_text ?? "The flash sale go on. The offer will end in — This Sunday";
  const announcementLink = content?.announcement_link ?? "/properties";
  const homeNavLabel = content?.home_nav_label ?? "Home";
  const loginLabel = content?.login_label ?? "Admin Login";
  const addListingLabel = content?.add_listing_label ?? "Admin Portal";
  const addListingLink = content?.add_listing_link ?? "/admin/login";

  const siteName = branding?.site_name ?? "Home Real Estate";
  const logoPath = branding?.logo_path ?? "/images/logo/logo.svg";
  const logoAlt = branding?.logo_alt ?? siteName;
  const menuItems = (navigation && navigation.length > 0 ? navigation : fallbackNavigation)
    .slice()
    .sort((first, second) => first.order - second.order);

  return (
    <header className="theme-main-menu menu-overlay menu-style-one sticky-menu">
      <div className="alert-wrapper text-center">
        <p className="fs-16 m0 text-white">
          {announcementText} <a href={announcementLink} className="fw-500">View Offer</a>
        </p>
      </div>

      <div className="inner-content gap-one">
        <div className="top-header position-relative">
          <div className="d-flex align-items-center justify-content-between">
            <div className="logo order-lg-0">
              <a href="/" className="d-flex align-items-center">
                <img src={logoPath} alt={logoAlt} className="site-brand-logo" />
              </a>
            </div>

            <div className="right-widget ms-auto ms-lg-0 me-3 me-lg-0 order-lg-3">
              <ul className="d-flex align-items-center style-none">
                <li>
                  <a href="/admin/login" className="btn-one"><i className="fa-regular fa-lock"></i> <span>{loginLabel}</span></a>
                </li>
                <li className="d-none d-md-inline-block ms-3">
                  <a href={addListingLink} className="btn-two"><span>{addListingLabel}</span> <i className="fa-thin fa-arrow-up-right"></i></a>
                </li>
              </ul>
            </div>
            <nav className="navbar navbar-expand-lg p0 order-lg-2">
              <button className="navbar-toggler d-block d-lg-none" type="button" data-bs-toggle="collapse"
                data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false"
                aria-label="Toggle navigation">
                <span></span>
              </button>
              <div className="collapse navbar-collapse" id="navbarNav">
                <ul className="navbar-nav align-items-lg-center">
                  <li className="d-block d-lg-none">
                    <div className="logo">
                      <a href="/" className="d-flex align-items-center">
                        <img src={logoPath} alt={logoAlt} className="site-brand-logo" />
                      </a>
                    </div>
                  </li>

                  <li className="nav-item">
                    <a className="nav-link" href="/">{homeNavLabel}</a>
                  </li>

                  {menuItems.map((item) => (
                    <li className="nav-item" key={`${item.pageKey}-${item.path}`}>
                      <a className="nav-link" href={item.path}>{item.label}</a>
                    </li>
                  ))}

                  <li className="d-md-none ps-2 pe-2 mt-20">
                    <a href={addListingLink} className="btn-two w-100"><span>{addListingLabel}</span> <i className="fa-thin fa-arrow-up-right"></i></a>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}

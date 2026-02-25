import Link from "next/link";
import { TemplatePageShell } from "@/components/template-page-shell";
import { LoginModal } from "@/features/shared/login-modal";
import { ScrollTopButton } from "@/features/shared/scroll-top";
import { cmsThemeScripts } from "@/features/cms/cms-theme-scripts";
import { fetchPublicAgents, type PublicAgent } from "@/lib/public-api";

type DynamicAgentsPageProps = {
  routePath: string;
  pageTitle?: string | null;
  pageContent?: Record<string, unknown>;
};

function toStringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
}

function toIntegerValue(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function toSortValue(value: unknown, fallback: "newest" | "oldest" | "name_asc" | "name_desc") {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "newest" || normalized === "oldest" || normalized === "name_asc" || normalized === "name_desc") {
    return normalized;
  }

  return fallback;
}

function agentDetailsUrl(routePath: string, slug: string) {
  const normalizedBase = routePath === "/" ? "" : routePath.replace(/\/+$/, "");
  return `${normalizedBase}/${slug}`;
}

function agentLocation(agent: PublicAgent) {
  const city = agent.agency?.city?.trim() ?? "";
  const state = agent.agency?.state?.trim() ?? "";
  const country = agent.agency?.country?.trim() ?? "";

  return [city, state, country]
    .filter((segment) => segment !== "")
    .join(", ");
}

function displayAgentRole(agent: PublicAgent) {
  if (agent.position && agent.position.trim() !== "") {
    return agent.position;
  }

  return "Property Agent";
}

function displayAgentAvatar(agent: PublicAgent) {
  if (agent.avatar_path && agent.avatar_path.trim() !== "") {
    return agent.avatar_path;
  }

  return "/images/agent/img_01.jpg";
}

export async function DynamicAgentsPage({
  routePath,
  pageTitle,
  pageContent,
}: DynamicAgentsPageProps) {
  const title = toStringValue(pageContent?.hero_title, pageTitle ?? "Our Agents");
  const subtitle = toStringValue(
    pageContent?.hero_subtitle,
    "Meet our active real-estate agents and connect directly for buying, selling, and rentals.",
  );
  const emptyMessage = toStringValue(
    pageContent?.empty_message,
    "No active agents are available right now.",
  );
  const perPage = toIntegerValue(pageContent?.per_page, 12);
  const sort = toSortValue(pageContent?.sort, "name_asc");
  const search = toStringValue(pageContent?.search, "");

  const response = await fetchPublicAgents({
    per_page: perPage,
    sort,
    ...(search !== "" ? { search } : {}),
  });

  const agents = response.data ?? [];

  return (
    <TemplatePageShell scripts={cmsThemeScripts}>
      <div className="main-page-wrapper">
        <section className="inner-banner-one inner-banner bg-pink text-center z-1 pt-160 lg-pt-130 pb-110 xl-pb-80 md-pb-60 position-relative">
          <div className="container">
            <h3 className="mb-20 xl-mb-15 pt-15">{title}</h3>
            <p className="fs-22">{subtitle}</p>
          </div>
          <img src="/images/lazy.svg" data-src="/images/assets/ils_07.svg" alt="" className="lazy-img shapes w-100 illustration" />
        </section>

        <section className="agent-section-one position-relative z-1 mt-140 xl-mt-110 pb-120 xl-pb-90">
          <div className="container">
            {!response.ok ? (
              <div className="alert alert-danger mb-30">
                {response.message ?? "Unable to load agents at this moment."}
              </div>
            ) : null}

            <div className="row">
              {agents.map((agent, index) => {
                const detailsPath = agentDetailsUrl(routePath, agent.slug);
                const location = agentLocation(agent);
                const agencyName = agent.agency?.name?.trim() ?? "";
                const count = agent.published_properties_count ?? 0;

                return (
                  <div className="col-xl-3 col-md-4 col-sm-6 d-flex mb-35 wow fadeInUp" data-wow-delay={`${(index % 4) * 0.1}s`} key={agent.id}>
                    <div className="agent-card-one position-relative w-100">
                      <div className="img border-20 overflow-hidden">
                        <img src={displayAgentAvatar(agent)} alt={agent.full_name} className="w-100 tran5s" />
                      </div>
                      <div className="text">
                        <h6 className="name mb-5">
                          <Link href={detailsPath} className="stretched-link">
                            {agent.full_name}
                          </Link>
                        </h6>
                        <div className="fs-14">{displayAgentRole(agent)}</div>
                        {agencyName !== "" ? <div className="fs-14 mt-5">{agencyName}</div> : null}
                        {location !== "" ? <div className="fs-14 mt-5">{location}</div> : null}
                        <div className="fs-14 mt-5">{`${count} active listing${count === 1 ? "" : "s"}`}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {agents.length === 0 ? (
              <div className="text-center mt-50">
                <p className="fs-20">{emptyMessage}</p>
              </div>
            ) : null}
          </div>
        </section>

        <LoginModal />
        <ScrollTopButton />
      </div>
    </TemplatePageShell>
  );
}

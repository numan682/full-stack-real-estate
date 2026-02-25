"use client";

import { useMemo, useState } from "react";

export type PricingPlanFeature = {
  label: string;
  included?: boolean;
};

export type PricingPlan = {
  id: string;
  name: string;
  description?: string;
  cadenceLabel?: string;
  monthlyPrice: string;
  yearlyPrice?: string;
  ctaLabel: string;
  ctaLink: string;
  highlighted?: boolean;
  features: PricingPlanFeature[];
};

type PricingPlanSwitcherProps = {
  plans: PricingPlan[];
  variant?: "matrix" | "cards";
  defaultCycle?: "monthly" | "yearly";
  showYearly?: boolean;
  discountText?: string;
};

function currentPrice(plan: PricingPlan, cycle: "monthly" | "yearly") {
  if (cycle === "yearly" && typeof plan.yearlyPrice === "string" && plan.yearlyPrice.trim() !== "") {
    return plan.yearlyPrice;
  }

  return plan.monthlyPrice;
}

function toFeatureLookup(features: PricingPlanFeature[]) {
  const lookup = new Map<string, boolean>();

  for (const feature of features) {
    const key = feature.label.trim().toLowerCase();
    if (key === "") {
      continue;
    }

    lookup.set(key, feature.included ?? true);
  }

  return lookup;
}

function featureIncluded(plan: PricingPlan, featureLabel: string) {
  const lookup = toFeatureLookup(plan.features);
  return lookup.get(featureLabel.trim().toLowerCase()) ?? false;
}

export function PricingPlanSwitcher({
  plans,
  variant = "matrix",
  defaultCycle = "monthly",
  showYearly = true,
  discountText = "Save 30% on Annual plan",
}: PricingPlanSwitcherProps) {
  const [cycle, setCycle] = useState<"monthly" | "yearly">(defaultCycle);

  const featureLabels = useMemo(() => {
    const labels: string[] = [];

    for (const plan of plans) {
      for (const feature of plan.features) {
        const label = feature.label.trim();
        if (label === "" || labels.includes(label)) {
          continue;
        }

        labels.push(label);
      }
    }

    return labels;
  }, [plans]);

  if (plans.length === 0) {
    return null;
  }

  if (variant === "cards") {
    return (
      <>
        {showYearly ? (
          <nav className="pricing-nav-one d-flex justify-content-center mb-30">
            <div className="nav nav-tabs" role="tablist" aria-label="Pricing cycle">
              <button
                type="button"
                className={`nav-link ${cycle === "monthly" ? "active" : ""}`}
                aria-selected={cycle === "monthly"}
                onClick={() => setCycle("monthly")}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`nav-link ${cycle === "yearly" ? "active" : ""}`}
                aria-selected={cycle === "yearly"}
                onClick={() => setCycle("yearly")}
              >
                Yearly
              </button>
            </div>
          </nav>
        ) : null}

        <div className="row gx-xxl-5 pt-40 lg-pt-10">
          {plans.map((plan) => (
            <div className="col-lg-4" key={plan.id}>
              <div className={`pr-column-wrapper mt-30 ${plan.highlighted ? "active" : ""}`}>
                <div className="pr-header text-center mb-55">
                  <div className="plan fw-500 text-uppercase color-dark">{plan.name}</div>
                  <strong className="price fw-500">{currentPrice(plan, cycle)}</strong>
                  {plan.cadenceLabel ? <p className="fs-24">{plan.cadenceLabel}</p> : null}
                  {plan.description ? <p className="fs-16">{plan.description}</p> : null}
                </div>

                <ul className="style-none text-center">
                  {plan.features.map((feature) => (
                    <li key={`${plan.id}-${feature.label}`} className={feature.included === false ? "disable" : ""}>
                      {feature.label}
                    </li>
                  ))}
                </ul>

                <div className="pr-footer text-center mt-60">
                  <a href={plan.ctaLink} className="btn-twelve w-100 rounded-0 sm">{plan.ctaLabel}</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="pr-table-one">
      {showYearly ? (
        <nav className="pricing-nav-one d-flex justify-content-center">
          <div className="nav nav-tabs" role="tablist" aria-label="Pricing cycle">
            <button
              type="button"
              className={`nav-link ${cycle === "monthly" ? "active" : ""}`}
              aria-selected={cycle === "monthly"}
              onClick={() => setCycle("monthly")}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`nav-link ${cycle === "yearly" ? "active" : ""}`}
              aria-selected={cycle === "yearly"}
              onClick={() => setCycle("yearly")}
            >
              Yearly
            </button>
          </div>
        </nav>
      ) : null}

      {showYearly ? <div className="discount-text mt-15 text-center">{discountText}</div> : null}

      <div className="dot-bg-wrapper mt-60 lg-mt-40">
        <div className="main-bg d-flex flex-wrap justify-content-end position-relative">
          <div className="left-panel d-none d-lg-block">
            <ul className="style-none">
              {featureLabels.map((featureLabel) => (
                <li key={featureLabel}>{featureLabel}</li>
              ))}
            </ul>
          </div>

          {plans.map((plan) => (
            <div className={`pr-column-wrapper ${plan.highlighted ? "active" : ""}`} key={plan.id}>
              <div className="pr-header text-center">
                <div className="plan text-uppercase">{plan.name}</div>
                <strong className="price fw-500">{currentPrice(plan, cycle)}</strong>
                {plan.description ? <p className="fs-16">{plan.description}</p> : null}
              </div>

              <ul className="style-none text-center">
                {featureLabels.map((featureLabel) => {
                  const included = featureIncluded(plan, featureLabel);

                  return (
                    <li key={`${plan.id}-${featureLabel}`}>
                      <span className="fw-500 color-dark">{featureLabel}</span>
                      <div className={`icon d-flex align-items-center justify-content-center rounded-circle ${included ? "available" : ""}`}>
                        <i className={`fa-sharp fa-regular ${included ? "fa-check" : "fa-xmark"}`}></i>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="pr-footer text-center">
                <a href={plan.ctaLink} className="btn-twelve sm">{plan.ctaLabel}</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

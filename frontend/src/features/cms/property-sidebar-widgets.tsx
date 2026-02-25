"use client";

import { FormEvent, useMemo, useState } from "react";

type PropertySidebarWidgetsProps = {
  propertyId: number;
  propertyTitle: string;
  inquiryPath?: string;
  defaultHomePrice?: number | null;
  defaultDownPaymentPercent: number;
  defaultInterestRatePercent: number;
  defaultLoanYears: number;
};

type InquiryStatus = {
  type: "idle" | "loading" | "success" | "error";
  message: string;
};

type MortgageResult = {
  monthlyPayment: number;
  loanAmount: number;
  totalInterest: number;
};

type InquiryErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

async function parseInquiryPayload(response: Response): Promise<InquiryErrorPayload> {
  try {
    return await response.json() as InquiryErrorPayload;
  } catch {
    return {};
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function sanitizeNumberInput(value: string) {
  return value.replace(/[^0-9.-]/g, "");
}

function parseInputNumber(value: string): number | null {
  const parsed = Number.parseFloat(sanitizeNumberInput(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function firstValidationError(errors: Record<string, string[]> | undefined): string | null {
  if (!errors) {
    return null;
  }

  const entries = Object.values(errors);

  for (const entry of entries) {
    if (Array.isArray(entry) && entry.length > 0 && typeof entry[0] === "string") {
      return entry[0];
    }
  }

  return null;
}

function calculateMortgage(
  homePrice: number,
  downPaymentPercent: number,
  annualRatePercent: number,
  loanYears: number,
): MortgageResult {
  const downAmount = homePrice * (downPaymentPercent / 100);
  const loanAmount = Math.max(homePrice - downAmount, 0);
  const monthlyRate = annualRatePercent / 100 / 12;
  const totalPayments = loanYears * 12;

  const monthlyPayment = totalPayments <= 0
    ? 0
    : monthlyRate === 0
      ? loanAmount / totalPayments
      : loanAmount * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalPayments)));

  const totalInterest = Math.max(monthlyPayment * totalPayments - loanAmount, 0);

  return {
    monthlyPayment,
    loanAmount,
    totalInterest,
  };
}

export function PropertySidebarWidgets({
  propertyId,
  propertyTitle,
  inquiryPath = "/api/inquiries",
  defaultHomePrice,
  defaultDownPaymentPercent,
  defaultInterestRatePercent,
  defaultLoanYears,
}: PropertySidebarWidgetsProps) {
  const [tourForm, setTourForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    message: `Hello, I am interested in [${propertyTitle}]`,
  });
  const [inquiryStatus, setInquiryStatus] = useState<InquiryStatus>({
    type: "idle",
    message: "",
  });

  const [homePriceInput, setHomePriceInput] = useState(() =>
    defaultHomePrice && defaultHomePrice > 0 ? String(Math.round(defaultHomePrice)) : "",
  );
  const [downPaymentInput, setDownPaymentInput] = useState(() =>
    String(Number(defaultDownPaymentPercent.toFixed(2))),
  );
  const [interestRateInput, setInterestRateInput] = useState(() =>
    String(Number(defaultInterestRatePercent.toFixed(2))),
  );
  const [loanYearsInput, setLoanYearsInput] = useState(() =>
    String(Math.max(Math.round(defaultLoanYears), 1)),
  );
  const [mortgageError, setMortgageError] = useState<string | null>(null);

  const initialMortgageResult = useMemo(() => {
    if (!defaultHomePrice || defaultHomePrice <= 0) {
      return null;
    }

    return calculateMortgage(
      defaultHomePrice,
      defaultDownPaymentPercent,
      defaultInterestRatePercent,
      Math.max(Math.round(defaultLoanYears), 1),
    );
  }, [defaultHomePrice, defaultDownPaymentPercent, defaultInterestRatePercent, defaultLoanYears]);

  const [mortgageResult, setMortgageResult] = useState<MortgageResult | null>(initialMortgageResult);

  async function handleTourSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (inquiryStatus.type === "loading") {
      return;
    }

    setInquiryStatus({
      type: "loading",
      message: "Submitting your request...",
    });

    try {
      const response = await fetch(inquiryPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          property_id: propertyId,
          source: "listing-tour-schedule",
          full_name: tourForm.full_name.trim(),
          email: tourForm.email.trim(),
          phone: tourForm.phone.trim(),
          message: tourForm.message.trim(),
        }),
      });

      const payload = await parseInquiryPayload(response);

      if (!response.ok) {
        const message = firstValidationError(payload.errors)
          ?? payload.message
          ?? "Could not submit your tour request right now.";

        setInquiryStatus({
          type: "error",
          message,
        });
        return;
      }

      setInquiryStatus({
        type: "success",
        message: payload.message ?? "Tour request sent successfully.",
      });

      setTourForm({
        full_name: "",
        email: "",
        phone: "",
        message: `Hello, I am interested in [${propertyTitle}]`,
      });
    } catch {
      setInquiryStatus({
        type: "error",
        message: "Network error. Please try again.",
      });
    }
  }

  function handleMortgageSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const homePrice = parseInputNumber(homePriceInput);
    const downPaymentPercent = parseInputNumber(downPaymentInput);
    const annualRatePercent = parseInputNumber(interestRateInput);
    const years = parseInputNumber(loanYearsInput);

    if (homePrice === null || homePrice <= 0) {
      setMortgageError("Home price must be greater than zero.");
      return;
    }

    if (downPaymentPercent === null || downPaymentPercent < 0 || downPaymentPercent >= 100) {
      setMortgageError("Down payment must be between 0 and 99.99.");
      return;
    }

    if (annualRatePercent === null || annualRatePercent < 0 || annualRatePercent > 100) {
      setMortgageError("Interest rate must be between 0 and 100.");
      return;
    }

    if (years === null || years <= 0) {
      setMortgageError("Loan term must be at least 1 year.");
      return;
    }

    setMortgageError(null);
    setMortgageResult(
      calculateMortgage(
        homePrice,
        downPaymentPercent,
        annualRatePercent,
        Math.round(years),
      ),
    );
  }

  return (
    <>
      <div className="tour-schedule bg-white border-20 p-30 mb-40">
        <h5 className="mb-40">Schedule Tour</h5>
        <form onSubmit={handleTourSubmit} noValidate>
          <div className="input-box-three mb-25">
            <div className="label">Your Name*</div>
            <input
              name="full_name"
              type="text"
              placeholder="Your full name"
              className="type-input"
              value={tourForm.full_name}
              onChange={(event) => setTourForm((previous) => ({
                ...previous,
                full_name: event.target.value,
              }))}
              required
            />
          </div>

          <div className="input-box-three mb-25">
            <div className="label">Your Email*</div>
            <input
              name="email"
              type="email"
              placeholder="Enter mail address"
              className="type-input"
              value={tourForm.email}
              onChange={(event) => setTourForm((previous) => ({
                ...previous,
                email: event.target.value,
              }))}
              required
            />
          </div>

          <div className="input-box-three mb-25">
            <div className="label">Your Phone</div>
            <input
              name="phone"
              type="tel"
              placeholder="Your phone number"
              className="type-input"
              value={tourForm.phone}
              onChange={(event) => setTourForm((previous) => ({
                ...previous,
                phone: event.target.value,
              }))}
            />
          </div>

          <div className="input-box-three mb-15">
            <div className="label">Message*</div>
            <textarea
              name="message"
              value={tourForm.message}
              onChange={(event) => setTourForm((previous) => ({
                ...previous,
                message: event.target.value,
              }))}
              required
            ></textarea>
          </div>

          <button
            className="btn-nine text-uppercase rounded-3 w-100 mb-10"
            type="submit"
            disabled={inquiryStatus.type === "loading"}
          >
            {inquiryStatus.type === "loading" ? "SENDING..." : "INQUIRY"}
          </button>

          {inquiryStatus.type !== "idle" ? (
            <p
              className={`fs-16 m0 ${inquiryStatus.type === "error" ? "text-danger" : "text-success"}`}
              aria-live="polite"
            >
              {inquiryStatus.message}
            </p>
          ) : null}
        </form>
      </div>

      <div className="mortgage-calculator bg-white border-20 p-30 mb-40">
        <h5 className="mb-40">Mortgage Calculator</h5>
        <form onSubmit={handleMortgageSubmit}>
          <div className="input-box-three mb-25">
            <div className="label">Home Price*</div>
            <input
              type="text"
              value={homePriceInput}
              onChange={(event) => setHomePriceInput(event.target.value)}
              inputMode="decimal"
              className="type-input"
            />
          </div>

          <div className="input-box-three mb-25">
            <div className="label">Down Payment (%)*</div>
            <input
              type="text"
              value={downPaymentInput}
              onChange={(event) => setDownPaymentInput(event.target.value)}
              inputMode="decimal"
              className="type-input"
            />
          </div>

          <div className="input-box-three mb-25">
            <div className="label">Interest Rate (%)*</div>
            <input
              type="text"
              value={interestRateInput}
              onChange={(event) => setInterestRateInput(event.target.value)}
              inputMode="decimal"
              className="type-input"
            />
          </div>

          <div className="input-box-three mb-25">
            <div className="label">Loan Terms (Years)</div>
            <input
              type="text"
              value={loanYearsInput}
              onChange={(event) => setLoanYearsInput(event.target.value)}
              inputMode="numeric"
              className="type-input"
            />
          </div>

          <button className="btn-five text-uppercase sm rounded-3 w-100 mb-10" type="submit">
            CALCULATE
          </button>

          {mortgageError ? (
            <p className="fs-16 text-danger m0" aria-live="polite">{mortgageError}</p>
          ) : null}

          {mortgageResult ? (
            <div className="mt-20 p-20 border rounded-3">
              <div className="fs-16 text-uppercase mb-5">Estimated Monthly</div>
              <h4 className="m0">{`${formatCurrency(mortgageResult.monthlyPayment)}/mo`}</h4>
              <div className="pt-10 fs-16">
                <div>{`Loan Amount: ${formatCurrency(mortgageResult.loanAmount)}`}</div>
                <div>{`Total Interest: ${formatCurrency(mortgageResult.totalInterest)}`}</div>
              </div>
            </div>
          ) : null}
        </form>
      </div>
    </>
  );
}

"use client";

import { FormEvent, useState } from "react";

type InquiryStatus = {
  type: "idle" | "loading" | "success" | "error";
  message: string;
};

type InquiryErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

type ContactInquiryFormProps = {
  endpoint?: string;
  source?: string;
  heading?: string;
  submitLabel?: string;
  loadingLabel?: string;
  successMessage?: string;
  defaultMessage?: string;
};

async function parsePayload(response: Response): Promise<InquiryErrorPayload> {
  try {
    return await response.json() as InquiryErrorPayload;
  } catch {
    return {};
  }
}

function firstValidationError(errors?: Record<string, string[]>): string | null {
  if (!errors) {
    return null;
  }

  const values = Object.values(errors);
  for (const entry of values) {
    if (Array.isArray(entry) && entry.length > 0 && typeof entry[0] === "string") {
      return entry[0];
    }
  }

  return null;
}

export function ContactInquiryForm({
  endpoint = "/api/inquiries",
  source = "contact-page",
  heading = "Send Message",
  submitLabel = "Send Message",
  loadingLabel = "Sending...",
  successMessage = "Your message was sent successfully.",
  defaultMessage = "",
}: ContactInquiryFormProps) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    message: defaultMessage,
  });
  const [status, setStatus] = useState<InquiryStatus>({
    type: "idle",
    message: "",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (status.type === "loading") {
      return;
    }

    setStatus({
      type: "loading",
      message: loadingLabel,
    });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          source,
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          message: form.message.trim(),
        }),
      });

      const payload = await parsePayload(response);

      if (!response.ok) {
        setStatus({
          type: "error",
          message: firstValidationError(payload.errors) ?? payload.message ?? "Unable to send your message right now.",
        });
        return;
      }

      setStatus({
        type: "success",
        message: payload.message ?? successMessage,
      });
      setForm((previous) => ({
        ...previous,
        full_name: "",
        email: "",
        phone: "",
      }));
    } catch {
      setStatus({
        type: "error",
        message: "Network error. Please try again.",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h3>{heading}</h3>
      <div className="messages"></div>
      <div className="row controls">
        <div className="col-12">
          <div className="input-group-meta form-group mb-30">
            <label htmlFor="contact-full-name">Name*</label>
            <input
              id="contact-full-name"
              name="full_name"
              type="text"
              placeholder="Your Name*"
              required
              value={form.full_name}
              onChange={(event) => setForm((previous) => ({
                ...previous,
                full_name: event.target.value,
              }))}
            />
          </div>
        </div>
        <div className="col-12">
          <div className="input-group-meta form-group mb-30">
            <label htmlFor="contact-email">Email*</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              placeholder="Email Address*"
              required
              value={form.email}
              onChange={(event) => setForm((previous) => ({
                ...previous,
                email: event.target.value,
              }))}
            />
          </div>
        </div>
        <div className="col-12">
          <div className="input-group-meta form-group mb-30">
            <label htmlFor="contact-phone">Phone</label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              placeholder="Your Phone Number"
              value={form.phone}
              onChange={(event) => setForm((previous) => ({
                ...previous,
                phone: event.target.value,
              }))}
            />
          </div>
        </div>
        <div className="col-12">
          <div className="input-group-meta form-group mb-35">
            <label htmlFor="contact-message">Message*</label>
            <textarea
              id="contact-message"
              name="message"
              placeholder="Your message*"
              required
              value={form.message}
              onChange={(event) => setForm((previous) => ({
                ...previous,
                message: event.target.value,
              }))}
            ></textarea>
          </div>
        </div>
        <div className="col-12">
          <button
            className="btn-nine text-uppercase rounded-3 fw-normal w-100"
            type="submit"
            disabled={status.type === "loading"}
          >
            {status.type === "loading" ? loadingLabel : submitLabel}
          </button>
        </div>
      </div>

      {status.type !== "idle" ? (
        <p
          className={`fs-16 mt-15 mb-0 ${status.type === "error" ? "text-danger" : "text-success"}`}
          aria-live="polite"
        >
          {status.message}
        </p>
      ) : null}
    </form>
  );
}

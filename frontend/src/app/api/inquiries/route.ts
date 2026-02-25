import { NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/api-base";

type InquiryPayload = {
  property_id?: number | null;
  full_name?: string;
  email?: string;
  phone?: string;
  message?: string;
  source?: string;
};

type JsonLike = Record<string, unknown>;

async function parseJsonSafe(response: Response): Promise<JsonLike> {
  try {
    return await response.json() as JsonLike;
  } catch {
    return {};
  }
}

function toTrimmedString(value: unknown, maxLength: number): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function normalizeInquiryPayload(payload: InquiryPayload): InquiryPayload | null {
  const fullName = toTrimmedString(payload.full_name, 120);
  const email = toTrimmedString(payload.email, 180);
  const phone = toTrimmedString(payload.phone, 40);
  const message = toTrimmedString(payload.message, 2000);
  const source = toTrimmedString(payload.source, 50);

  if (fullName === "" || email === "" || message === "") {
    return null;
  }

  const rawPropertyId = payload.property_id;
  const propertyId = typeof rawPropertyId === "number"
    ? Math.trunc(rawPropertyId)
    : Number.parseInt(String(rawPropertyId ?? ""), 10);

  return {
    ...(Number.isInteger(propertyId) && propertyId > 0 ? { property_id: propertyId } : {}),
    full_name: fullName,
    email,
    ...(phone !== "" ? { phone } : {}),
    message,
    ...(source !== "" ? { source } : {}),
  };
}

export async function POST(request: Request) {
  let payload: InquiryPayload;

  try {
    payload = await request.json() as InquiryPayload;
  } catch {
    return NextResponse.json(
      {
        message: "Invalid request payload.",
      },
      {
        status: 400,
      },
    );
  }

  const normalizedPayload = normalizeInquiryPayload(payload);

  if (!normalizedPayload) {
    return NextResponse.json(
      {
        message: "full_name, email, and message are required.",
      },
      {
        status: 422,
      },
    );
  }

  try {
    const response = await fetch(`${getBackendBaseUrl()}/api/v1/inquiries`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalizedPayload),
      cache: "no-store",
    });

    const responsePayload = await parseJsonSafe(response);

    return NextResponse.json(responsePayload, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        message: "Unable to submit inquiry right now.",
      },
      {
        status: 502,
      },
    );
  }
}

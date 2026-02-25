import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_TOKEN_COOKIE } from "@/lib/admin/session";

function resolveRedirectPath(request: NextRequest, fallbackPath: string): string {
  const nextPath = request.nextUrl.searchParams.get("next");

  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return fallbackPath;
  }

  return nextPath;
}

export function GET(request: NextRequest) {
  const redirectPath = resolveRedirectPath(request, "/admin/login");
  const response = NextResponse.redirect(new URL(redirectPath, request.url));

  response.cookies.delete(ADMIN_TOKEN_COOKIE);

  return response;
}

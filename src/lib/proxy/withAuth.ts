import { NextRequest, NextResponse } from "next/server";
import type { ProxyFactory } from "./types";
import { verifyToken, createTokens, setTokenCookies } from "@/lib/auth";

const PRIVATE_PATHS = [
  "/api/user",
  "/auth/logout",
  "/auth/change-password",
  "/settings",
  "/api/protected-data",
  "/dashboard",
];

export const withAuth: ProxyFactory = (next) => {
  return async (request: NextRequest) => {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("token")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    const isPrivate = PRIVATE_PATHS.some((path) => pathname.startsWith(path));
    let refreshedResponse: NextResponse | null = null;
    let hasValidAccess = false;

    const accessUser = await verifyToken(token);
    if (accessUser) {
      hasValidAccess = true;
    }

    if (!hasValidAccess) {
      const refreshUser = await verifyToken(refreshToken);
      if (refreshUser) {
        const tokens = await createTokens(refreshUser);
        const response = NextResponse.next();
        setTokenCookies(response, tokens);
        hasValidAccess = true;
        refreshedResponse = response;
      }
    }

    if (!isPrivate) {
      return refreshedResponse ?? next(request);
    }

    if (hasValidAccess) {
      return refreshedResponse ?? next(request);
    }

    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/login", request.url));
  };
};

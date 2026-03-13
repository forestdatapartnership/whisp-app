import type { NextRequest } from "next/server";
import { stackProxies, withCors, withAuth } from "@/lib/proxy";

const handler = stackProxies([withCors, withAuth]);

export default function proxy(request: NextRequest) {
  return handler(request);
}

export const config = {
  matcher: [
    "/api/submit/:path*",
    "/api/user/:path*",
    "/api/protected-data/:path*",
    "/auth/logout",
    "/auth/change-password",
    "/settings/:path*",
    "/dashboard/:path*",
  ],
};

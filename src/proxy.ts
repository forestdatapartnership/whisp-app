import type { NextRequest } from "next/server";
import { stackProxies, withCors, withAuth } from "@/lib/proxy";

const handler = stackProxies([withCors, withAuth]);

export default function proxy(request: NextRequest) {
  return handler(request);
}

export const config = {
  matcher: [
    "/api/submit/:path*",
    "/api/protected-data/:path*",
    "/settings/:path*",
    "/dashboard/:path*",
  ],
};

import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import type { ProxyFactory } from "./types";

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-KEY",
};

export const withCors: ProxyFactory = (next) => {
  return async (request: NextRequest) => {
    if (!request.nextUrl.pathname.startsWith("/api/submit/")) {
      return next(request);
    }

    const allowedOrigins = config.cors.allowedOrigins;
    const origin = request.headers.get("origin") ?? "";
    const isAllowedOrigin = allowedOrigins.includes(origin);
    const isPreflight = request.method === "OPTIONS";

    if (isPreflight) {
      return NextResponse.json(
        {},
        {
          headers: {
            ...(isAllowedOrigin && { "Access-Control-Allow-Origin": origin }),
            ...CORS_HEADERS,
          },
        }
      );
    }

    const response = await next(request);

    if (response && isAllowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;
  };
};

import { NextRequest, NextResponse, NextFetchEvent } from "next/server";
import { MiddlewareFactory } from "./types";

export const withApiKey: MiddlewareFactory = () => {
	return async (request: NextRequest, _next: NextFetchEvent) => {
		const { pathname } = request.nextUrl;

		const protectedPaths = [
			"/api/wkt", "/api/geoids", "/api/geojson",
			"/api/submit/wkt", "/api/submit/geo-ids", "/api/submit/geojson"
		];

		const isProtectedPath = protectedPaths.some(path =>
			pathname === path || pathname.startsWith(`${path}/`));

		if (!isProtectedPath) {
			return NextResponse.next();
		}

		const apiKey = request.headers.get("x-api-key");
		if (!apiKey) {
			return NextResponse.json({ error: "Missing API key" }, { status: 401 });
		}

		return NextResponse.next();
	};
};


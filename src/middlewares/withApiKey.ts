import { NextRequest, NextResponse, NextFetchEvent } from "next/server";
import { MiddlewareFactory } from "./types";
import { getPool } from "@/lib/db";

export const withApiKey: MiddlewareFactory = (next) => {
	return async (request: NextRequest, _next: NextFetchEvent) => {
		const { pathname } = request.nextUrl;

		// Updated protected paths to include both old and new routes
		const protectedPaths = [
			"/api/wkt", "/api/geoids", "/api/geojson", // Old paths (redirected)
			"/api/submit/wkt", "/api/submit/geo-ids", "/api/submit/geojson" // New paths
		];
		
		// Check if the path starts with any of the protected paths
		const isProtectedPath = protectedPaths.some(path => 
			pathname === path || pathname.startsWith(`${path}/`));
			
		if (!isProtectedPath) {
			return NextResponse.next();
		}

		const apiKey = request.headers.get("x-api-key");
		if (!apiKey) {
			return NextResponse.json({ error: "Missing API key" }, { status: 401 });
		}

			// Get the database pool and a client
		const pool = await getPool();
		const client = await pool.connect();
		try {
			const result = await client.query(
				"SELECT user_id FROM find_api_key($1)",
				[apiKey]
			);

			if (result.rowCount === 0) {
				return NextResponse.json({ error: "Invalid or expired API key" }, { status: 401 });
			}

			const userId = result.rows[0].user_id;
			const requestHeaders = new Headers(request.headers);
			requestHeaders.set("x-user-id", userId.toString());

			return NextResponse.next({
				request: { headers: requestHeaders },
			});
		} finally {
			client.release();
		}
	};
};


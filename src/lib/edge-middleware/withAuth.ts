import {
    NextFetchEvent,
    NextRequest,
    NextResponse
} from "next/server";
import { MiddlewareFactory } from "./types";
import { verifyToken, createTokens, setTokenCookies } from "@/lib/auth";

export const withAuth: MiddlewareFactory = (next) => {
    return async (request: NextRequest, _next: NextFetchEvent) => {
        const { pathname } = request.nextUrl;
        const token = request.cookies.get("token")?.value;
        const refreshToken = request.cookies.get("refreshToken")?.value;

        const privatePaths = [
            "/api/user",
            "/auth/logout",
            "/auth/change-password",
            "/settings",
            "/api/protected-data",
            "/dashboard",
        ];

        const isPrivate = privatePaths.some(path => pathname.startsWith(path));
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
            return refreshedResponse ?? NextResponse.next();
        }

        if (hasValidAccess) {
            return refreshedResponse ?? NextResponse.next();
        }

        if (pathname.startsWith("/api")) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
        } else {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    };
};

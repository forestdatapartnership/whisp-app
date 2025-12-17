import {
    NextFetchEvent,
    NextRequest,
    NextResponse
} from "next/server";
import { MiddlewareFactory } from "./types";
import { jwtVerify, SignJWT } from "jose";
import { assertEnvVar } from "@/lib/utils";

export const withAuth: MiddlewareFactory = (next) => {
    return async (request: NextRequest, _next: NextFetchEvent) => {
        const SECRET_KEY = assertEnvVar('JWT_SECRET');
        const secretBytes = new TextEncoder().encode(SECRET_KEY);
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

        if (token) {
            try {
                const { payload } = await jwtVerify(token, secretBytes);
                if (payload.sub) {
                    hasValidAccess = true;
                }
            } catch (error) {
                console.error("Access token verification failed:", error);
            }
        }

        if (!hasValidAccess && refreshToken) {
            try {
                const { payload } = await jwtVerify(refreshToken, secretBytes);
                if (payload.sub) {
                    const newAccessToken = await new SignJWT({ sub: payload.sub })
                        .setProtectedHeader({ alg: "HS256" })
                        .setIssuedAt()
                        .setExpirationTime("15m")
                        .sign(secretBytes);

                    const newRefreshToken = await new SignJWT({ sub: payload.sub })
                        .setProtectedHeader({ alg: "HS256" })
                        .setIssuedAt()
                        .setExpirationTime("7d")
                        .sign(secretBytes);

                    const response = NextResponse.next();
                    response.cookies.set('token', newAccessToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict',
                        path: '/',
                        maxAge: 900
                    });
                    response.cookies.set('refreshToken', newRefreshToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict',
                        path: '/',
                        maxAge: 604800
                    });

                    hasValidAccess = true;
                    refreshedResponse = response;
                }
            } catch (refreshError) {
                console.error("Refresh token is invalid or expired:", refreshError);
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

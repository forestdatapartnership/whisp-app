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
        // Assert JWT secret is present at startup
        const SECRET_KEY = assertEnvVar('JWT_SECRET');
        const { pathname } = request.nextUrl;

        // Check if user is on home page and has a valid token - redirect to dashboard
        if (pathname === "/" || pathname === "/index") {
            const token = request.cookies.get("token")?.value;
            if (token) {
                try {
                    // Verify token validity
                    await jwtVerify(token, new TextEncoder().encode(SECRET_KEY));
                    // Redirect to dashboard if token is valid
                    return NextResponse.redirect(new URL("/dashboard", request.url));
                } catch (error) {
                    // Token is invalid, continue to home page
                    console.error("Token verification failed on home page:", error);
                }
            }
        }

        const privatePaths = [
            "/api/api-key",
            "/api/download-csv",
            "/api/user/profile",
            "/auth/logout",
            "/auth/change-password",
            "/settings",
            "/api/protected-data",
            "/dashboard",
        ];

        if (!privatePaths.some(path => pathname.startsWith(path))) {
            return NextResponse.next();
        }

        const token = request.cookies.get("token")?.value;
        const refreshToken = request.cookies.get("refreshToken")?.value;

        if (token) {
            try {
                const { payload } = await jwtVerify(
                    token,
                    new TextEncoder().encode(SECRET_KEY)
                );

                if (!payload.sub) throw new Error("Invalid token payload: Missing 'sub'");
                
                // Simply allow the request to proceed - getAuthUser will extract the data from the token
                return NextResponse.next();
            } catch (error) {
                console.error("Access token verification failed:", error);
            }
        }

        if (refreshToken) {
            try {
                const { payload } = await jwtVerify(
                    refreshToken,
                    new TextEncoder().encode(SECRET_KEY)
                );
                if (!payload.sub) throw new Error("Invalid refresh token payload: Missing 'sub'");

                // Generate new access token
                const newAccessToken = await new SignJWT({ sub: payload.sub })
                    .setProtectedHeader({ alg: "HS256" })
                    .setIssuedAt()
                    .setExpirationTime("15m")
                    .sign(new TextEncoder().encode(SECRET_KEY));

                // Generate new refresh token
                const newRefreshToken = await new SignJWT({ sub: payload.sub })
                    .setProtectedHeader({ alg: "HS256" })
                    .setIssuedAt()
                    .setExpirationTime("7d")
                    .sign(new TextEncoder().encode(SECRET_KEY));

                const response = NextResponse.next();

                // Set new tokens as cookies
                response.cookies.set('token', newAccessToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'strict',
                    path: '/',
                    maxAge: 900 // 15 minutes
                });

                response.cookies.set('refreshToken', newRefreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'strict',
                    path: '/',
                    maxAge: 604800 // 7 days
                });

                return response;
            } catch (refreshError) {
                console.error("Refresh token is invalid or expired:", refreshError);
            }
        }

        if (pathname.startsWith("/api")) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
        } else {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    };
};

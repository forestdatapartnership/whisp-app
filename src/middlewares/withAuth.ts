import {
    NextFetchEvent,
    NextRequest,
    NextResponse
} from "next/server";
import { MiddlewareFactory } from "./types";
import { jwtVerify, SignJWT } from "jose";

export const withAuth: MiddlewareFactory = (next) => {
    return async (request: NextRequest, _next: NextFetchEvent) => {

        const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key";
        const { pathname } = request.nextUrl;

        const publicPaths = [
            "/api/auth/login",
            "/api/auth/register",
            "/login",
            "/register",
            "/api/auth/change-password"
        ];

        if (
            publicPaths.includes(pathname) ||
            pathname.startsWith("/api/submit/")
        ) {
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

                // Add sub to request headers
                const requestHeaders = new Headers(request.headers);
                requestHeaders.set('x-user-id', payload.sub);

                // Token is valid - pass along with modified headers
                return NextResponse.next({
                    request: {
                        headers: requestHeaders
                    }
                });
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

                // Add sub to request headers
                const requestHeaders = new Headers(request.headers);
                requestHeaders.set('x-user-id', payload.sub);

                const response = NextResponse.next({
                    request: {
                        headers: requestHeaders
                    }
                });

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

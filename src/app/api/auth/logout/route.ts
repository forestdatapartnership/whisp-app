import { NextRequest, NextResponse } from "next/server";
import { compose } from "@/lib/utils/compose";
import { withLogging } from "@/lib/hooks/withLogging";

export const GET = compose(
    withLogging
)(async (req: NextRequest, ...args): Promise<NextResponse> => {
    const [log] = args;
    const logSource = "logout/route.ts";
    
    const response = NextResponse.json({ message: "Logout successful" });
    
    // Clear the access token cookie
    response.cookies.set('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0
    });
    
    // Clear the refresh token cookie
    response.cookies.set('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0
    });

    log("debug", "User successfully logged out", logSource);

    return response;
});

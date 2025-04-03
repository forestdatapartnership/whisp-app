import { NextRequest, NextResponse } from "next/server";
import { serialize } from "cookie";
import { compose } from "@/utils/compose";
import { withLogging } from "@/lib/hooks/withLogging";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";

export const GET = compose(
    withLogging,
    withErrorHandling
)(async (req: NextRequest, ...args): Promise<NextResponse> => {
    const [log] = args;
    const logSource = "logout/route.ts";
    const expiredCookie = serialize("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0
    });

    const response = NextResponse.json({ message: "Logout successful" });
    response.headers.set("Set-Cookie", expiredCookie);

    log("info", "User successfully logged out", logSource);

    return response;
});

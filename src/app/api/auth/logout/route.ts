import { NextRequest, NextResponse } from "next/server";
import { compose } from "@/lib/api-middleware/compose";
import { withLogging } from "@/lib/api-middleware/withLogging";
import { withErrorHandling } from "@/lib/api-middleware/withErrorHandling";
import { useResponse } from "@/lib/api-middleware/responses";
import { SystemCode } from "@/types/systemCodes";
import { LogFunction } from "@/lib/logger";

export const GET = compose(
    withLogging,
    withErrorHandling
)(async (req: NextRequest, log: LogFunction): Promise<NextResponse> => {
    
    const response = useResponse(SystemCode.AUTH_LOGOUT_SUCCESS);
    
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

    return response;
});

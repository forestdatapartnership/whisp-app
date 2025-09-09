import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { getPool } from "@/lib/db";
import { withRequiredJsonBody } from "@/lib/hooks/withRequiredJsonBody";
import { withLogging } from "@/lib/hooks/withLogging";
import { compose } from "@/lib/utils/compose";
import { assertEnvVar } from "@/lib/utils";
import { useResponse } from "@/lib/hooks/responses";
import { SystemCode } from "@/types/systemCodes";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { validateRequiredFields } from "@/lib/utils/fieldValidation";
import { LogFunction } from "@/lib/logger";

export const POST = compose(
    withLogging,
    withErrorHandling,
    withRequiredJsonBody
)(async (req: NextRequest, log: LogFunction, body: any): Promise<NextResponse> => {
    const SECRET_KEY = assertEnvVar('JWT_SECRET');

    const { email, password } = body;
    validateRequiredFields(body, ['email', 'password']);

    const pool = getPool();
    const client = await pool.connect();
    try {
        // Updated query to also return email_verified status
        const result = await client.query("SELECT id, email, email_verified FROM login_user($1, $2)", [email, password]);
        if (result.rowCount === 0) {
            return useResponse(SystemCode.AUTH_INVALID_CREDENTIALS);
        }

        const user = result.rows[0];
        
        // Check if email is verified
        if (!user.email_verified) {
            return useResponse(SystemCode.AUTH_EMAIL_NOT_VERIFIED);
        }

        // Generate Access Token
        const accessToken = await new SignJWT({ sub: user.id })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("30m")
            .sign(new TextEncoder().encode(SECRET_KEY));

        // Generate Refresh Token
        const refreshToken = await new SignJWT({ sub: user.id })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("7d")
            .sign(new TextEncoder().encode(SECRET_KEY));

        const response = useResponse(
            SystemCode.AUTH_LOGIN_SUCCESS,
            { user: { id: user.id, email: user.email } }
        );

        // Set tokens as cookies
        response.cookies.set('token', accessToken, { 
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: '/',
            maxAge: 1800  // 30 minutes
        });
        
        response.cookies.set('refreshToken', refreshToken, { 
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: '/',
            maxAge: 604800  // 7 days
        });

        return response;
    } finally {
        client.release();
    }
});

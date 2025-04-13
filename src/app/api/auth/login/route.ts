import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import pool from "@/lib/db";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { withRequiredJsonBody } from "@/lib/hooks/withRequiredJsonBody";
import { withLogging } from "@/lib/hooks/withLogging";
import { compose } from "@/utils/compose";
import { assertEnvVar } from "@/lib/utils";

export const POST = compose(
    withLogging,
    withErrorHandling,
    withRequiredJsonBody
)(async (req: NextRequest, ...args): Promise<NextResponse> => {
    const [log, body] = args;
    const SECRET_KEY = assertEnvVar('JWT_SECRET');

    const { email, password } = body;

    if (email && password) {
        const client = await pool.connect();
        try {
            const result = await client.query("SELECT id, email FROM login_user($1, $2)", [email, password]);
            if (result.rowCount === 0) {
                return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
            }

            const user = result.rows[0];

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

            const response = NextResponse.json({ message: "Login successful" });

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
        } catch {
            return NextResponse.json({ error: "Server error" }, { status: 500 });
        } finally {
            client.release();
        }
    }

    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
});

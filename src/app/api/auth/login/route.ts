import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { withJsonBody } from "@/lib/hooks/withJsonBody";
import { withLogging } from "@/lib/hooks/withLogging";
import { compose } from "@/lib/utils/compose";
import { useResponse } from "@/lib/hooks/responses";
import { SystemCode } from "@/types/systemCodes";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { validateRequiredFields } from "@/lib/utils/fieldValidation";
import { LogFunction } from "@/lib/logger";
import { createTokens, setTokenCookies } from "@/lib/auth";

export const POST = compose(
    withLogging,
    withErrorHandling,
    withJsonBody
)(async (_req: NextRequest, _log: LogFunction, body: any): Promise<NextResponse> => {
    const { email, password } = body;
    validateRequiredFields(body, ['email', 'password']);

    const pool = getPool();
    const client = await pool.connect();
    try {
        const result = await client.query("SELECT id, uuid, email, email_verified, is_admin FROM login_user($1, $2)", [email, password]);
        if (result.rowCount === 0) {
            return useResponse(SystemCode.AUTH_INVALID_CREDENTIALS);
        }

        const user = result.rows[0];

        if (!user.email_verified) {
            return useResponse(SystemCode.AUTH_EMAIL_NOT_VERIFIED);
        }

        const tokens = await createTokens({ id: user.uuid, email: user.email, isAdmin: user.is_admin });

        const response = useResponse(
            SystemCode.AUTH_LOGIN_SUCCESS,
            { user: { id: user.uuid, email: user.email, isAdmin: user.is_admin } }
        );

        setTokenCookies(response, tokens);

        return response;
    } finally {
        client.release();
    }
});

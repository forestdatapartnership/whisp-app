import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { SystemCode } from "@/types/systemCodes";
import { SystemError } from "@/types/systemError";
import { useResponse } from "@/lib/hooks/responses";
import { withLogging } from "@/lib/hooks/withLogging";
import { withRequiredJsonBody } from "@/lib/hooks/withRequiredJsonBody";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { compose } from "@/lib/utils/compose";
import { LogFunction } from "@/lib/logger";
import { validateRequiredFields } from "@/lib/utils/fieldValidation";

export const POST = compose(
	withLogging,
	withErrorHandling,
	withRequiredJsonBody
)(async (req: NextRequest, log: LogFunction, body: any): Promise<NextResponse> => {
	const { email, currentPassword, newPassword } = body;
	validateRequiredFields(body, ['email', 'currentPassword', 'newPassword']);
	
	const pool = getPool();
	const client = await pool.connect();
	try {
		const result = await client.query(
			`SELECT change_password($1, $2, $3) AS message`,
			[email, currentPassword, newPassword]
		);

		const message = result.rows[0].message;
		if (message === "Password changed successfully") {
			return useResponse(SystemCode.AUTH_PASSWORD_CHANGED_SUCCESS);
		} else {
			throw new SystemError(SystemCode.USER_INVALID_PASSWORD);
		}
	} finally {
		client.release();
	}
});

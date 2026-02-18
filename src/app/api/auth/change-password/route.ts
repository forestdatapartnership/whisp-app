import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { SystemCode } from "@/types/systemCodes";
import { SystemError } from "@/types/systemError";
import { useResponse } from "@/lib/hooks/responses";
import { withLogging } from "@/lib/hooks/withLogging";
import { withJsonBody } from "@/lib/hooks/withJsonBody";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { withAuthUser, AuthUser } from "@/lib/hooks/withAuthUser";
import { compose } from "@/lib/utils/compose";
import { LogFunction } from "@/lib/logger";
import { validateRequiredFields } from "@/lib/utils/fieldValidation";

export const POST = compose(
	withLogging,
	withErrorHandling,
	withAuthUser,
withJsonBody
)(async (req: NextRequest, log: LogFunction, body: any, user: AuthUser): Promise<NextResponse> => {
	const { currentPassword, newPassword } = body;
	validateRequiredFields(body, ['currentPassword', 'newPassword']);

	const pool = getPool();
	const client = await pool.connect();
	try {
		// TODO use uuid instead of an additional query to get the email
		const emailResult = await client.query(
			`SELECT email FROM users WHERE uuid = $1`,
			[user.id]
		);

		if (!emailResult.rowCount) {
			throw new SystemError(SystemCode.USER_NOT_FOUND);
		}

		const email = emailResult.rows[0].email;
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

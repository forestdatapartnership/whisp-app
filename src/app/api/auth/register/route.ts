import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { compose } from "@/lib/utils/compose";
import { withLogging } from "@/lib/hooks/withLogging";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/mailer";
import { withRequiredJsonBody } from "@/lib/hooks/withRequiredJsonBody";
import { useResponse } from "@/lib/hooks/responses";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { validateRequiredFields } from "@/lib/utils/fieldValidation";
import { SystemCode } from "@/types/systemCodes";
import { LogFunction } from "@/lib/logger";
import { SystemError } from "@/types/systemError";

const emailAttemptCache = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;

const validatePassword = (password: string): boolean => {
	const minLength = 8;
	const hasUpperCase = /[A-Z]/.test(password);
	const hasLowerCase = /[a-z]/.test(password);
	const hasNumber = /[0-9]/.test(password);
	const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

	return (
		password.length >= minLength &&
		hasUpperCase &&
		hasLowerCase &&
		hasNumber &&
		hasSpecialChar
	);
};

export const POST = compose(
	withLogging,
	withErrorHandling,
	withRequiredJsonBody
)(async (_req: NextRequest, log: LogFunction, body: any): Promise<NextResponse> => {
	const logSource = "register/route.ts";
	const { name, lastName, organization, email, password } = body;

	const now = Date.now();
	const attemptRecord = emailAttemptCache.get(email);

	if (attemptRecord && now - attemptRecord.firstAttempt < WINDOW_MS && attemptRecord.count >= MAX_ATTEMPTS) {
		log("warn", `Rate limit exceeded for email ${email}`, logSource);
		// don't reveal the rate limit exceeded error
		return useResponse(SystemCode.USER_REGISTRATION_SUCCESS);
	}

	if (!attemptRecord || now - attemptRecord.firstAttempt >= WINDOW_MS) {
		emailAttemptCache.set(email, { count: 1, firstAttempt: now });
	} else {
		attemptRecord.count += 1;
		emailAttemptCache.set(email, attemptRecord);
	}

	validateRequiredFields(body, ['name', 'lastName', 'email', 'password']);

	if (!validatePassword(password)) {
		throw new SystemError(SystemCode.USER_WEAK_PASSWORD);
	}

	const pool = await getPool();
	const client = await pool.connect();
	try {
		const result = await client.query(
			"SELECT register_user($1, $2, $3, $4, $5) AS message",
			[name, lastName, organization, email, password]
		);

		const message = result.rows[0].message;

		if (message === "Email already exists") {
			throw new SystemError(SystemCode.USER_EMAIL_ALREADY_EXISTS);
		}

		if (message !== "User registered successfully") {
			throw new SystemError(SystemCode.USER_REGISTRATION_FAILED);
		}

		const token = randomBytes(32).toString("hex");
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

		await client.query(
			"SELECT insert_email_verification_token($1, $2, $3)",
			[email, token, expiresAt]
		);

		await sendVerificationEmail(email, token);

		return useResponse(SystemCode.USER_REGISTRATION_SUCCESS);
	} finally {
		client.release();
	}
});


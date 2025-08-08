import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { compose } from "@/lib/utils/compose";
import { withLogging } from "@/lib/hooks/withLogging";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/mailer";
import { withRequiredJsonBody } from "@/lib/hooks/withRequiredJsonBody";

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
	withRequiredJsonBody
)(async (_req: NextRequest, ...args): Promise<NextResponse> => {
	const logSource = "register/route.ts";
	const [log, body] = args;
	const { name, lastName, organization, email, password } = body;

	const genericRegistrationMessage = "If your email is new or not verified, you will receive a verification email.";

	const now = Date.now();
	const attemptRecord = emailAttemptCache.get(email);

	if (attemptRecord && now - attemptRecord.firstAttempt < WINDOW_MS && attemptRecord.count >= MAX_ATTEMPTS) {
		log("warn", `Rate limit exceeded for email ${email}`, logSource);
		return NextResponse.json({ message: genericRegistrationMessage }, { status: 200 });
	}

	if (!attemptRecord || now - attemptRecord.firstAttempt >= WINDOW_MS) {
		emailAttemptCache.set(email, { count: 1, firstAttempt: now });
	} else {
		attemptRecord.count += 1;
		emailAttemptCache.set(email, attemptRecord);
	}

	if (!name || !lastName || !email || !password) {
		return NextResponse.json({ error: "All fields are required" }, { status: 400 });
	}

	if (!validatePassword(password)) {
		return NextResponse.json({
			error: "Password must be at least 8 characters long, contain uppercase, lowercase, number, and special character."
		}, { status: 400 });
	}

	const pool = await getPool();
	const client = await pool.connect();
	try {
		const result = await client.query(
			"SELECT register_user($1, $2, $3, $4, $5) AS message",
			[name, lastName, organization, email, password]
		);

		const message = result.rows[0].message;

		const genericRegistrationMessage = "If your email is new or not verified, you will receive a verification email.";

		if (message === "Email already exists") {
			return NextResponse.json({ message: genericRegistrationMessage }, { status: 200 });
		}

		if (message !== "User registered successfully") {
			return NextResponse.json({ error: "Registration failed" }, { status: 400 });
		}

		const token = randomBytes(32).toString("hex");
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

		await client.query(
			"SELECT insert_email_verification_token($1, $2, $3)",
			[email, token, expiresAt]
		);

		await sendVerificationEmail(email, token);

		return NextResponse.json({ message: genericRegistrationMessage }, { status: 200 });
	} catch (error) {
		log("error", error, logSource);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	} finally {
		client.release();
	}
});


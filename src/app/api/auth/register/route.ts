import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { compose } from "@/lib/utils/compose";
import { withLogging } from "@/lib/hooks/withLogging";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/mailer";
import { withRequiredJsonBody } from "@/lib/hooks/withRequiredJsonBody";

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

		if (message !== "User registered successfully") {
			return NextResponse.json({ error: message }, { status: 400 });
		}

		const token = randomBytes(32).toString("hex");
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

		await client.query(
			"SELECT insert_email_verification_token($1, $2, $3)",
			[email, token, expiresAt]
		);

		await sendVerificationEmail(email, token);

		return NextResponse.json({ message: "User registered. Verification email sent." }, { status: 201 });
	} catch (error) {
		log("error", error, logSource);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	} finally {
		client.release();
	}
});


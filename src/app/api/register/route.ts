import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db"; // PostgreSQL connection
import { compose } from "@/utils/compose";
import { withLogging } from "@/lib/hooks/withLogging";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { withRequiredJsonBody } from "@/lib/hooks/withRequiredJsonBody";

export const POST = compose(
	withLogging,
	withErrorHandling,
	withRequiredJsonBody
)(async (req: NextRequest, ...args): Promise<NextResponse> => {
	const logSource = "register/route.ts"

	const [log, body] = args;

	const { name, lastName, organization, email, password } = body;

	if (!name || !lastName || !email || !password) {
		return NextResponse.json({ error: "All fields are required" }, { status: 400 });
	}

	const client = await pool.connect();
	try {
		// Call the PostgreSQL register_user function
		const result = await client.query(
			"SELECT register_user($1, $2, $3, $4, $5) AS message",
			[name, lastName, organization, email, password]
		);

		const message = result.rows[0].message;

		if (message === "Email already exists") {
			return NextResponse.json({ error: message }, { status: 409 });
		}

		return NextResponse.json({ message }, { status: 201 });
	} catch (error) {
		log("error", error, logSource);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	} finally {
		client.release();
	}
});

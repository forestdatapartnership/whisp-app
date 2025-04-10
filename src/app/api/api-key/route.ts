import { NextRequest, NextResponse } from "next/server";
import { compose } from "@/utils/compose";
import { withLogging } from "@/lib/hooks/withLogging";
import { getAuthUser } from "@/lib/auth";
import pool from "@/lib/db";
import { createHash, randomUUID } from "crypto";

export const GET = compose(
	withLogging
)(async (req: NextRequest, ...args): Promise<NextResponse> => {
	const logSource = "apikey/route.ts";
	const [log] = args;

	const user = await getAuthUser(req);
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const key = randomUUID();
	const hashedKey = createHash("sha256").update(key).digest("hex");
	const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

	const client = await pool.connect();
	try {
		await client.query(
			"SELECT * FROM create_or_replace_api_key($1, $2, $3)",
			[user.id, hashedKey, expires_at]
		);

		return NextResponse.json({ key }); // Return raw key only
	} catch (error) {
		log("error", error, logSource);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	} finally {
		client.release();
	}
});

export const DELETE = compose(
	withLogging,
	withErrorHandling
)(async (req: NextRequest, ...args): Promise<NextResponse> => {
	const logSource = "apikey/route.ts";
	const [log] = args;

	const user = await getAuthUser(req);
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const client = await pool.connect();
	try {
		await client.query("SELECT delete_api_key_by_user($1)", [user.id]);
		return NextResponse.json({ success: true });
	} catch (error) {
		log("error", error, logSource);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	} finally {
		client.release();
	}
});

import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: NextRequest): Promise<NextResponse> {
	const { email, currentPassword, newPassword } = await req.json();

	const client = await pool.connect();
	try {
		const result = await client.query(
			`SELECT change_password($1, $2, $3) AS message`,
			[email, currentPassword, newPassword]
		);

		const message = result.rows[0].message;
		return message === "Password changed successfully"
			? NextResponse.json({ message })
			: NextResponse.json({ error: message }, { status: 400 });
	} finally {
		client.release();
	}
}

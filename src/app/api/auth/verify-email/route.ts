import { NextRequest, NextResponse } from 'next/server';
import { getPool } from "@/lib/db";

// This explicitly tells Next.js this route should be dynamically rendered
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	try {
		// Get token from URL query parameters using nextUrl instead of request.url
		const token = request.nextUrl.searchParams.get('token');
		
		if (!token) {
			return NextResponse.json({ error: 'Token is required' }, { status: 400 });
		}

		// Connect to the database
		const pool = await getPool();
		const client = await pool.connect();
		
		try {
			// Call the verify_email_by_token function
			const result = await client.query(
				"SELECT verify_email_by_token($1) AS message",
				[token]
			);
			
			const message = result.rows[0].message;
			
			// Check the result message
			if (message === 'Email verified successfully') {
				return NextResponse.json({ message }, { status: 200 });
			} else {
				return NextResponse.json({ error: message }, { status: 400 });
			}
		} finally {
			client.release();
		}
	} catch (error) {
		console.error('Error in verify-email route:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
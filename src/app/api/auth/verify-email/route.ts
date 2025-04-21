import { NextResponse } from 'next/server';
import pool from "@/lib/db";

export async function GET(request: Request) {
	try {
		// Get token from URL query parameters
		const url = new URL(request.url);
		const token = url.searchParams.get('token');
		
		if (!token) {
			return NextResponse.json({ error: 'Token is required' }, { status: 400 });
		}

		// Connect to the database
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
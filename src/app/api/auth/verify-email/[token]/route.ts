import { NextRequest, NextResponse } from 'next/server';
import { getPool } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.pathname.split('/').pop();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const pool = await getPool();
    const client = await pool.connect();

    try {
      const result = await client.query(
        "SELECT verify_email_by_token($1) AS message",
        [token]
      );

      const message = result.rows[0].message;

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

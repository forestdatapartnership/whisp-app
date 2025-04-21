import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import pool from "@/lib/db";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { withLogging } from "@/lib/hooks/withLogging";
import { compose } from "@/utils/compose";

export const GET = compose(
  withLogging,
  withErrorHandling
)(async (req: NextRequest, ...args): Promise<NextResponse> => {
  const [log] = args;
  
  // Get the authenticated user from request headers
  const user = await getAuthUser(req);
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Convert string user ID to integer with validation
  const userId = parseInt(user.id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    // Use the get_user_profile database function with integer userId
    const result = await client.query("SELECT * FROM get_user_profile($1)", [userId]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return the user profile data
    return NextResponse.json({ user: result.rows[0] });
  } finally {
    client.release();
  }
});
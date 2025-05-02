import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getPool } from "@/lib/db";
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

  const pool = await getPool();
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

export const PUT = compose(
  withLogging,
  withErrorHandling
)(async (req: NextRequest, ...args): Promise<NextResponse> => {
  const [log] = args;
  const logSource = "profile/route.ts";
  
  // Get the authenticated user
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get data from request body
  const body = await req.json();
  const { name, lastName, organization } = body;
  
  // Validate required fields
  if (!name || !lastName) {
    return NextResponse.json({ error: "Name and last name are required" }, { status: 400 });
  }

  const userId = parseInt(user.id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  const pool = await getPool();
  const client = await pool.connect();
  try {
    // Update user profile
    const result = await client.query(
      "UPDATE users SET name = $1, last_name = $2, organization = $3 WHERE id = $4 RETURNING id, name, last_name, organization, email, email_verified",
      [name, lastName, organization, userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return the updated user profile
    return NextResponse.json({ 
      user: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        last_name: result.rows[0].last_name,
        organization: result.rows[0].organization,
        email: result.rows[0].email,
        email_verified: result.rows[0].email_verified
      },
      message: "Profile updated successfully" 
    });
  } catch (error) {
    log("error", error, logSource);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  } finally {
    client.release();
  }
});

export const DELETE = compose(
  withLogging,
  withErrorHandling
)(async (req: NextRequest, ...args): Promise<NextResponse> => {
  const [log] = args;
  const logSource = "profile/route.ts";
  
  // Get the authenticated user
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(user.id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  // Optional: Require password confirmation for account deletion
  const { password } = await req.json();
  if (!password) {
    return NextResponse.json({ error: "Password confirmation is required" }, { status: 400 });
  }

  const pool = await getPool();
  const client = await pool.connect();
  try {
    // First verify the password
    const verifyResult = await client.query(
      "SELECT verify_password($1, $2) AS is_valid",
      [userId, password]
    );

    if (!verifyResult.rows[0]?.is_valid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Delete the user account (this will cascade to delete all related data)
    await client.query("DELETE FROM users WHERE id = $1", [userId]);

    // Return success message
    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    log("error", error, logSource);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  } finally {
    client.release();
  }
});
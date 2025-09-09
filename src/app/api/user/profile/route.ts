import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { withLogging } from "@/lib/hooks/withLogging";
import { compose } from "@/lib/utils/compose";
import { SystemCode } from "@/types/systemCodes";
import { useResponse } from "@/lib/hooks/responses";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { SystemError } from "@/types/systemError";
import { validateRequiredFields } from "@/lib/utils/fieldValidation";
import { LogFunction } from "@/lib/logger";

export const GET = compose(
  withLogging,
  withErrorHandling
)(async (req: NextRequest, log: LogFunction): Promise<NextResponse> => {
  
  // Get the authenticated user from request headers
  const user = await getAuthUser(req);
  
  if (!user) {
    throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);
  }

  // Convert string user ID to integer with validation
  const userId = parseInt(user.id, 10);
  if (isNaN(userId)) {
    throw new SystemError(SystemCode.USER_INVALID_USER_ID);
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    // Use the get_user_profile database function with integer userId
    const result = await client.query("SELECT * FROM get_user_profile($1)", [userId]);

    if (result.rowCount === 0) {
      return useResponse(SystemCode.USER_NOT_FOUND);
    }

    // Return the user profile data
    return useResponse(SystemCode.AUTH_STATUS_AUTHENTICATED, { user: result.rows[0] });
  } finally {
    client.release();
  }
});

export const PUT = compose(
  withLogging,
  withErrorHandling
)(async (req: NextRequest,  log: LogFunction): Promise<NextResponse> => {
  
  // Get the authenticated user
  const user = await getAuthUser(req);
  if (!user) {
    throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);
  }

  // Get data from request body
  const body = await req.json();
  const { name, lastName, organization } = body;
  validateRequiredFields(body, ['name', 'lastName']);

  const userId = parseInt(user.id, 10);
  if (isNaN(userId)) {
    return useResponse(SystemCode.USER_INVALID_USER_ID);
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    // Update user profile
    const result = await client.query(
      "UPDATE users SET name = $1, last_name = $2, organization = $3 WHERE id = $4 RETURNING id, name, last_name, organization, email, email_verified",
      [name, lastName, organization, userId]
    );

    if (result.rowCount === 0) {
      return useResponse(SystemCode.USER_NOT_FOUND);
    }

    // Return the updated user profile
    return useResponse(SystemCode.USER_PROFILE_UPDATE_SUCCESS, {
      user: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        last_name: result.rows[0].last_name,
        organization: result.rows[0].organization,
        email: result.rows[0].email,
        email_verified: result.rows[0].email_verified
      }
    });
  } finally {
    client.release();
  }
});

export const DELETE = compose(
  withLogging,
  withErrorHandling
)(async (req: NextRequest, log: LogFunction): Promise<NextResponse> => {
  
  // Get the authenticated user
  const user = await getAuthUser(req);
  if (!user) {
    throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);
  }

  const userId = parseInt(user.id, 10);
  if (isNaN(userId)) {
    throw new SystemError(SystemCode.USER_INVALID_USER_ID);
  }

  // Optional: Require password confirmation for account deletion
  const { password } = await req.json();
  if (!password) {
    throw new SystemError(SystemCode.USER_PASSWORD_CONFIRMATION_REQUIRED);
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    // First verify the password
    const verifyResult = await client.query(
      "SELECT verify_password($1, $2) AS is_valid",
      [userId, password]
    );

    if (!verifyResult.rows[0]?.is_valid) {
      throw new SystemError(SystemCode.USER_INVALID_PASSWORD);
    }

    // Delete the user account (this will cascade to delete all related data)
    await client.query("DELETE FROM users WHERE id = $1", [userId]);

    // Return success message
    return useResponse(SystemCode.USER_ACCOUNT_DELETION_SUCCESS);
  } finally {
    client.release();
  }
});
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { withLogging } from "@/lib/hooks/withLogging";
import { withAuthUser, AuthUser } from "@/lib/hooks/withAuthUser";
import { withJsonBody } from "@/lib/hooks/withJsonBody";
import { compose } from "@/lib/utils/compose";
import { SystemCode } from "@/types/systemCodes";
import { useResponse } from "@/lib/hooks/responses";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { SystemError } from "@/types/systemError";
import { validateRequiredFields } from "@/lib/utils/fieldValidation";
import { LogFunction } from "@/lib/logger";

export const GET = compose(
  withLogging,
  withErrorHandling,
  withAuthUser
)(async (_req: NextRequest, log: LogFunction, user: AuthUser): Promise<NextResponse> => {

  const pool = getPool();
  const client = await pool.connect();
  try {
    // TODO create user profile service to handle all database operations
    const result = await client.query("SELECT uuid, name, last_name, organization, email, email_verified, is_admin FROM users WHERE uuid = $1", [user.id]);

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
  withErrorHandling,
  withAuthUser,
  withJsonBody
)(async (_req: NextRequest,  log: LogFunction, body: any, user: AuthUser): Promise<NextResponse> => {

  const { name, lastName, organization } = body;
  validateRequiredFields(body, ['name', 'lastName']);

  const pool = getPool();
  const client = await pool.connect();
  try {
    // Update user profile
    const result = await client.query(
      "UPDATE users SET name = $1, last_name = $2, organization = $3 WHERE uuid = $4 RETURNING uuid, name, last_name, organization, email, email_verified",
      [name, lastName, organization, user.id]
    );

    if (result.rowCount === 0) {
      return useResponse(SystemCode.USER_NOT_FOUND);
    }

    // Return the updated user profile
    return useResponse(SystemCode.USER_PROFILE_UPDATE_SUCCESS, {
      user: {
        id: result.rows[0].uuid,
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
  withErrorHandling,
  withAuthUser,
  withJsonBody
)(async (_req: NextRequest, log: LogFunction, body: any, user: AuthUser): Promise<NextResponse> => {

  const { password } = body;
  if (!password) {
    throw new SystemError(SystemCode.USER_PASSWORD_CONFIRMATION_REQUIRED);
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    // First verify the password
    const verifyResult = await client.query(
      "SELECT verify_password($1, $2) AS is_valid",
      [user.id, password]
    );

    if (!verifyResult.rows[0]?.is_valid) {
      throw new SystemError(SystemCode.USER_INVALID_PASSWORD);
    }

    // Delete the user account (this will cascade to delete all related data)
    await client.query("DELETE FROM users WHERE uuid = $1", [user.id]);

    // Return success message
    return useResponse(SystemCode.USER_ACCOUNT_DELETION_SUCCESS);
  } finally {
    client.release();
  }
});
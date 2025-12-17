import { NextRequest, NextResponse } from "next/server";
import { compose } from "@/lib/utils/compose";
import { withLogging } from "@/lib/hooks/withLogging";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { withAuthUser, AuthenticatedUser } from "@/lib/hooks/withAuthUser";
import { getPool } from "@/lib/db";
import { SystemError } from "@/types/systemError";
import { SystemCode } from "@/types/systemCodes";
import { LogFunction } from "@/lib/logger";

export const GET = compose(
  withLogging,
  withErrorHandling,
  withAuthUser
)(async (_req: NextRequest, ...args): Promise<NextResponse> => {
  const logSource = "api-key/metadata/route.ts";
  const [log, user] = args as [LogFunction, AuthenticatedUser];

  const pool = await getPool();
  const client = await pool.connect();
  try {
    // Query API key metadata without exposing the actual key
    const result = await client.query(
      "SELECT * FROM get_api_key_metadata($1)",
      [user.userId]
    );
    
    const keyMetadata = result.rows[0];
    
    if (!keyMetadata) {
      return NextResponse.json({ 
        hasKey: false,
        metadata: null 
      });
    }
    
    return NextResponse.json({
      hasKey: true,
      metadata: {
        id: keyMetadata.id,
        userId: keyMetadata.user_id,
        createdAt: keyMetadata.created_at,
        expiresAt: keyMetadata.expires_at,
        revoked: keyMetadata.revoked
      }
    });
  } catch (error: any) {
    log("error", error, logSource);
    throw new SystemError(SystemCode.SYSTEM_INTERNAL_SERVER_ERROR);
  } finally {
    client.release();
  }
});
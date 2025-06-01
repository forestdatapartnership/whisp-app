import { NextRequest, NextResponse } from "next/server";
import { compose } from "@/lib/utils/compose";
import { withLogging } from "@/lib/hooks/withLogging";
import { getAuthUser } from "@/lib/auth";
import { getPool } from "@/lib/db";

export const GET = compose(
  withLogging
)(async (req: NextRequest, ...args): Promise<NextResponse> => {
  const logSource = "api-key/metadata/route.ts";
  const [log] = args;

  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pool = await getPool();
  const client = await pool.connect();
  try {
    // Query API key metadata without exposing the actual key
    const result = await client.query(
      "SELECT * FROM get_api_key_metadata($1)",
      [user.id]
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
  } catch (error) {
    log("error", error, logSource);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }
});
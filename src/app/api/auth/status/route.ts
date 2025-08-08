import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { assertEnvVar } from "@/lib/utils";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = assertEnvVar("JWT_SECRET");
  const token = req.cookies.get("token")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  const verify = async (value?: string) => {
    if (!value) return false;
    try {
      await jwtVerify(value, new TextEncoder().encode(secret));
      return true;
    } catch {
      return false;
    }
  };

  const authenticated = (await verify(token)) || (await verify(refreshToken));
  return NextResponse.json({ authenticated });
}



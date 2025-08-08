export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const access = req.cookies.get("token")?.value;
  const refresh = req.cookies.get("refreshToken")?.value;
  const secret = process.env.JWT_SECRET;

  const verify = async (value?: string) => {
    if (!value || !secret) return false;
    try {
      await jwtVerify(value, new TextEncoder().encode(secret));
      return true;
    } catch {
      return false;
    }
  };

  const authenticated = (await verify(access)) || (await verify(refresh));
  return NextResponse.json({ authenticated });
}



import { NextRequest } from "next/server";

export async function useJsonOrNull(req: NextRequest): Promise<any | null> {
  try {
    return req.body ? await req.json() : null;
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    return null;
  }
}
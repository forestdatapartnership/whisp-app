import { NextRequest } from "next/server";
import { error as logError } from "@/lib/logger"

export async function useJsonOrNull(req: NextRequest): Promise<any | null> {
  try {
    return req.body ? await req.json() : null;
  } catch (error) {
    logError("Failed to parse JSON: " + error);
    return null;
  }
}
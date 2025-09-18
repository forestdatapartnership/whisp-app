import { NextRequest } from "next/server";
import { LogFunction } from "@/lib/logger"

export async function useJsonOrNull(req: NextRequest, log: LogFunction): Promise<any | null> {
  try {
    return req.body ? await req.json() : null;
  } catch (error) {
    log("error", "Failed to parse JSON: " + error);
    return null;
  }
}

export function getRequestBodySize(req: NextRequest): number {
  const contentLength = req.headers.get('content-length');
  return contentLength ? parseInt(contentLength, 10) : 0;
}
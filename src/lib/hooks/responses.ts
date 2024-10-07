import { NextResponse } from "next/server";

export function useJsonResponse<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

export function useErrorResponse(message: string, status: number = 500): NextResponse {
  return useJsonResponse({ error: message }, status);
}

export function useBadRequestResponse(message: string, status: number = 400) : NextResponse {
    return useErrorResponse(message , status);
}

export function useMissingOrInvalidBodyResponse() : NextResponse {
    return useBadRequestResponse("Missing or invalid request body.");
}

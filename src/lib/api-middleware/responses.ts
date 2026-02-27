import { NextResponse } from "next/server";
import { SystemCode, getSystemCodeInfo, formatString } from "@/types/systemCodes";
import { ApiResponse } from "@/types/api";

export function useResponse<T>(systemCode: SystemCode): NextResponse<ApiResponse<T>>;
export function useResponse<T>(systemCode: SystemCode, data: T | undefined, context?: Record<string, any>, cause?: string): NextResponse<ApiResponse<T>>;
export function useResponse<T>(
  systemCode: SystemCode, 
  data?: T,
  context?: Record<string, any>,
  cause?: string
): NextResponse<ApiResponse<T>> {
  const originalInfo = getSystemCodeInfo(systemCode);
  const finalInfo = originalInfo.publicCode ? getSystemCodeInfo(originalInfo.publicCode) : originalInfo;
  
  const response: ApiResponse<T> = {
    code: finalInfo.code,
    message: finalInfo.message,
    data: data,
    ...(cause !== undefined ? { cause } : {}),
    ...(context && { context })
  };
  
  return NextResponse.json(response, { status: finalInfo.httpStatus });
}

export function useResponseWithFormat<T>(systemCode: SystemCode, formatArgs: (string | number)[], data?: T, cause?: string): NextResponse<ApiResponse<T>>;
export function useResponseWithFormat<T>(
  systemCode: SystemCode, 
  formatArgs: (string | number)[],
  data?: T,
  cause?: string
): NextResponse<ApiResponse<T>> {
  const originalInfo = getSystemCodeInfo(systemCode);
  const finalInfo = originalInfo.publicCode ? getSystemCodeInfo(originalInfo.publicCode) : originalInfo;
  
  const formattedMessage = formatString(finalInfo.message, ...formatArgs);
  
  const response: ApiResponse<T> = {
    code: finalInfo.code,
    message: formattedMessage,
    data: data,
    ...(cause !== undefined ? { cause } : {})
  };
  
  return NextResponse.json(response, { status: finalInfo.httpStatus });
}

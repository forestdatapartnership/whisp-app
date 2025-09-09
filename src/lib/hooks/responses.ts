import { NextResponse } from "next/server";
import { SystemCode, getSystemCodeInfo, formatString } from "@/types/systemCodes";
import { ApiResponse } from "@/types/api";

export function useResponse<T>(systemCode: SystemCode): NextResponse<ApiResponse<T>>;
export function useResponse<T>(systemCode: SystemCode, data: T): NextResponse<ApiResponse<T>>;
export function useResponse<T>(systemCode: SystemCode, formatArgs: (string | number)[]): NextResponse<ApiResponse<T>>;
export function useResponse<T>(systemCode: SystemCode, formatArgs: (string | number)[], data: T): NextResponse<ApiResponse<T>>;
export function useResponse<T>(
  systemCode: SystemCode, 
  formatArgsOrData?: (string | number)[] | T, 
  data?: T
): NextResponse<ApiResponse<T>> {
  const originalInfo = getSystemCodeInfo(systemCode);
  const finalInfo = originalInfo.publicCode ? getSystemCodeInfo(originalInfo.publicCode) : originalInfo;
  
  // Determine if second parameter is formatArgs or data
  const isFormatArgs = Array.isArray(formatArgsOrData);
  const formatArgs = isFormatArgs ? formatArgsOrData as (string | number)[] : undefined;
  const responseData = isFormatArgs ? data : formatArgsOrData as T;
  
  const formattedMessage = formatArgs ? formatString(finalInfo.message, ...formatArgs) : finalInfo.message;
  
  const response: ApiResponse<T> = {
    code: finalInfo.code,
    message: formattedMessage,
    data: responseData
  };
  
  return NextResponse.json(response, { status: finalInfo.httpStatus });
}

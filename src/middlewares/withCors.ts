import {
    NextFetchEvent,
    NextRequest,
    NextResponse
  } from "next/server";
import { MiddlewareFactory } from "./types";

const corsOptions = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-KEY',
  }

export const withCors : MiddlewareFactory = (next) => {
    return async(request: NextRequest, _next: NextFetchEvent) => {
        // Only apply CORS to submit/* routes
        if (!request.nextUrl.pathname.startsWith('/api/submit/')) {
            return next(request, _next);
        }

        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [];
        const origin = request.headers.get('origin') ?? '';
        const isAllowedOrigin = allowedOrigins.includes(origin);
        const isPreflight = request.method === 'OPTIONS';

        if (isPreflight) {
            const preflightHeaders = {
                ...(isAllowedOrigin && { 'Access-Control-Allow-Origin': origin }),
                ...corsOptions,
            }
            return NextResponse.json({}, { headers: preflightHeaders })
        }

        const response = await next(request, _next);

        if (response && isAllowedOrigin) {
            response.headers.set('Access-Control-Allow-Origin', origin);
            
            Object.entries(corsOptions).forEach(([key, value]) => {
                response.headers.set(key, value)
            })
        }
        
        return response;
    };
};
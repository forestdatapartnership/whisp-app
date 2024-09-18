import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

const corsOptions = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

export function middleware(request: NextRequest) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    const origin = request.headers.get('origin') ?? '';
    const isAllowedOrigin = allowedOrigins.includes(origin)
    
    const isPreflight = request.method === 'OPTIONS'
    if (isPreflight) {
        const preflightHeaders = {
        ...(isAllowedOrigin && { 'Access-Control-Allow-Origin': origin }),
        ...corsOptions,
        }
        return NextResponse.json({}, { headers: preflightHeaders })
    }

    // Handle other requests
    const response = NextResponse.next()
    
    if (isAllowedOrigin) {
        response.headers.set('Access-Control-Allow-Origin', origin)
    }
    
    Object.entries(corsOptions).forEach(([key, value]) => {
        response.headers.set(key, value)
    })
    
    return response
}
 
export const config = {
  matcher: '/:path*',
};

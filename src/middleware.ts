import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    const origin = request.headers.get('origin') ?? '';

    // Handle OPTIONS requests for preflight
    if (request.method === "OPTIONS") {
        const headers = new Headers();
        headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        // Dynamically check if origin is allowed
        if (allowedOrigins.includes(origin)) {
            headers.set('Access-Control-Allow-Origin', origin);
        } else {
            headers.set('Access-Control-Allow-Origin', 'null');
        }

        return new NextResponse(null, { status: 200, headers });
    }

    // Handle other requests
    if (allowedOrigins.includes(origin)) {
        const response = NextResponse.next();
        response.headers.set('Access-Control-Allow-Origin', origin);
        return response;
    }

    // Fallback for disallowed origins
    return new NextResponse('Origin not allowed', { status: 403 });
}
 
export const config = {
  matcher: '/api/:path*',
};

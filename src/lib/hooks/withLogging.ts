// lib/middleware.js
import { NextRequest, NextResponse } from 'next/server';
import { LogFunction, useLogger } from '../logger';

export function withLogging(handler : (req: NextRequest, log: LogFunction) => Promise<NextResponse>) {
        return async function (req: NextRequest): Promise<NextResponse> {
        const logger = useLogger();
        logger.defaultMeta = { 
            context: {
                ip: req.ip || req.headers.get('X-Forwarded-For'), 
                geo: req.geo,
                method: req.method,
                path: req.nextUrl.pathname,
                userAgent: req.headers.get('user-agent'),
                referrer: req.referrer
            }
        };
        const log = (level: 'debug' | 'info' | 'warn' | 'error', message: string, source?: string, meta?: Record<string, any>) => {
            const metadata = {
                ...meta,
                ...(source ? { source } : {}),
              };
            logger.log({
            level,
            message,
            ...metadata,
            });
        };

        return handler(req, log);
    };
}
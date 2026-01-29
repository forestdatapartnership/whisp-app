import { NextRequest, NextResponse } from 'next/server';
import { LogFunction, useLogger } from '../logger';

function getBaseContext(req: NextRequest) {
    return {
        ip: req.ip || req.headers.get('X-Forwarded-For'),
        method: req.method,
        path: req.nextUrl?.pathname,
        userAgent: req.headers?.get?.('user-agent'),
        referrer: req.referrer
    };
}

function createLogFunction(logger: ReturnType<typeof useLogger>): LogFunction {
    const context: Record<string, any> = {};
    
    const logFn = (level: 'debug' | 'info' | 'warn' | 'error', message: string, source?: string, meta?: Record<string, any>) => {
        const metadata = {
            ...(source ? { source } : {}),
            ...meta,
            ...(Object.keys(context).length > 0 ? { context } : {}),
        };
        logger.log({
            level,
            message,
            ...metadata,
        });
    };
    
    logFn.enrich = (newContext: Record<string, any>) => {
        Object.assign(context, newContext);
    };
    
    return logFn as LogFunction;
}

function createBaseLogger(req: NextRequest): { log: LogFunction; logger: ReturnType<typeof useLogger> } {
    const logger = useLogger();
    const log = createLogFunction(logger);
    
    log.enrich(getBaseContext(req));
    
    return { log, logger };
}

export function withLogging(handler: (req: NextRequest, log: LogFunction, ...args: any[]) => Promise<NextResponse>) {
    return async function(req: NextRequest, ...args: any[]): Promise<NextResponse> {
        const { log } = createBaseLogger(req);
        return handler(req, log, ...args);
    };
}


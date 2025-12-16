import { NextRequest, NextResponse } from 'next/server';
import { LogFunction, useLogger } from '../logger';
import { AnalysisJob } from '@/types/analysisJob';

function createLogger(req: NextRequest, context?: AnalysisJob): { log: LogFunction; logger: ReturnType<typeof useLogger> } {
    const logger = useLogger();
    
    logger.defaultMeta = {
        context: {
            ...(context ? {
                token: context.token,
                userEmail: context.userEmail,
                apiKeyId: context.apiKeyId,
            } : {}),
            ip: req.ip || req.headers.get('X-Forwarded-For'),
            method: req.method,
            path: req.nextUrl?.pathname,
            userAgent: req.headers?.get?.('user-agent'),
            referrer: req.referrer
        }
    };
    
    const log: LogFunction = (level: 'debug' | 'info' | 'warn' | 'error', message: string, source?: string, meta?: Record<string, any>) => {
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

    return { log, logger };
}

export function withLogging(handler: (req: NextRequest, log: LogFunction, ...args: any[]) => Promise<NextResponse>) {
    return async function(req: NextRequest, ...args: any[]): Promise<NextResponse> {
        const { log } = createLogger(req);
        return handler(req, log, ...args);
    };
}

export function withAnalysisLogging(handler: (req: NextRequest, context: AnalysisJob, log: LogFunction, ...args: any[]) => Promise<NextResponse>) {
    return async function(req: NextRequest, ...args: any[]): Promise<NextResponse> {
        const [context, ...rest] = args;
        const { log } = createLogger(req, context);
        return handler(req, context, log, ...rest);
    };
}


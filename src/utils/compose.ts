import { NextRequest, NextResponse } from 'next/server';


type RouteHandler = (req: NextRequest, ...args: any[]) => Promise<NextResponse>;

export function compose(...fns: Array<(handler: RouteHandler) => RouteHandler>): (handler: RouteHandler) => RouteHandler {
  return (finalHandler: RouteHandler) =>
    fns.reduceRight((acc, fn) => fn(acc), finalHandler);
}

import type { NextRequest } from "next/server";

export type ProxyHandler = (request: NextRequest) => Response | Promise<Response>;

export type ProxyFactory = (next: ProxyHandler) => ProxyHandler;

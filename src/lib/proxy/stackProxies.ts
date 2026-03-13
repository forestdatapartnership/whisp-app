import { NextResponse } from "next/server";
import type { ProxyFactory, ProxyHandler } from "./types";

export function stackProxies(factories: ProxyFactory[] = [], index = 0): ProxyHandler {
  const current = factories[index];
  if (current) {
    const next = stackProxies(factories, index + 1);
    return current(next);
  }
  return () => NextResponse.next();
}

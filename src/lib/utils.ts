import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function assertEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`)
  }
  return value
}

// to be moved into a dedicated settings class
export function getMaxFileSize() {
  return process.env.NEXT_PUBLIC_MAX_UPLOAD_FILE_SIZE_KB? Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_FILE_SIZE_KB)*1024 : undefined
}

export function getLogLevel() {
  return process.env.NEXT_PUBLIC_LOG_LEVEL || 'info'
}

/**
 * Check if a cookie exists in the browser
 * @param name Name of the cookie to check
 * @returns Boolean indicating if the cookie exists
 */
export function hasCookie(name: string): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName] = cookie.trim().split('=');
    if (cookieName === name) {
      return true;
    }
  }
  return false;
}
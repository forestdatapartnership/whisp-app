import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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

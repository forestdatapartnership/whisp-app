import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// to be moved into a dedicated settings class
export function getMaxFileSize() {
  return process.env.NEXT_PUBLIC_MAX_UPLOAD_FILE_SIZE_KB? Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_FILE_SIZE_KB)*1024 : undefined
}
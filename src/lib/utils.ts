import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Fusion intelligente des classes Tailwind */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
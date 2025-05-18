import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPercentage(value: number, decimals = 1): string {
  if (isNaN(value)) return 'N/A';
  return `${(value * 100).toFixed(decimals)}%`;
}

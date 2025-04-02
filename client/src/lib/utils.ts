import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to YYYY-MM-DD
export function formatDate(date: Date | string): string {
  if (typeof date === "string") {
    date = parseISO(date);
  }
  return format(date, "yyyy-MM-dd");
}

// Get current date in YYYY-MM-DD format
export function getCurrentDate(): string {
  return format(new Date(), "yyyy-MM-dd");
}

// Calculate percentage with optional decimal places
export function calculatePercentage(value: number, total: number, decimals = 0): number {
  if (total === 0) return 0;
  const percentage = (value / total) * 100;
  return Number(percentage.toFixed(decimals));
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM d, yyyy');
}

export function formatDateWithTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM d, yyyy h:mm a');
}

export function calculatePercentage(current: number, goal: number): number {
  if (goal === 0) return 0;
  return Math.min(Math.round((current / goal) * 100), 100);
}

export function getDayOfWeek(date: Date): string {
  return format(date, 'EEEE');
}

export function formatWeight(weight: number): string {
  return `${weight.toFixed(1)} kg`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMinutes} min`;
}

export function getCurrentDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getStartOfWeek(date: Date = new Date()): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(date.setDate(diff));
}

export function getEndOfWeek(date: Date = new Date()): Date {
  const day = date.getDay();
  const diff = date.getDate() + (day === 0 ? 0 : 7 - day); // Adjust when day is Sunday
  return new Date(date.setDate(diff));
}

export function getLastThirtyDays(): { startDate: Date, endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  return { startDate, endDate };
}

export function getCaloriesPercentage(calories: number, goal: number): number {
  return calculatePercentage(calories, goal);
}

export function getWorkoutsPercentage(workouts: number, goal: number): number {
  return calculatePercentage(workouts, goal);
}

export function getWeightChange(currentWeight: number, targetWeight: number): number {
  return Math.abs(currentWeight - targetWeight);
}

export function isWeightIncreaseGoal(currentWeight: number, targetWeight: number): boolean {
  return currentWeight < targetWeight;
}

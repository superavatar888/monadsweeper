import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function for conditionally joining Tailwind CSS classes.
 * It uses clsx for conditional class names and twMerge for resolving conflicting styles.
 * * @param inputs - An array of class values.
 * @returns The merged and resolved class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

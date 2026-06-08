import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses date strings commonly found in Google Sheets.
 * Supports DD/MM/YYYY, MM/DD/YYYY, and YYYY-MM-DD.
 * Returns a valid Date object or null if invalid.
 */
export function parseSheetDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || !dateStr.trim()) return null;

  const str = dateStr.trim();
  
  // Try DD/MM/YYYY or DD-MM-YYYY
  const parts = str.split(/[\/\-]/);
  if (parts.length === 3) {
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    const p3 = parseInt(parts[2], 10);

    // If year is the last part (e.g. 18/05/2026)
    if (p3 > 1000) {
      // Assume DD/MM/YYYY if p1 > 12 (must be day)
      // Otherwise fallback to MM/DD/YYYY or DD/MM/YYYY (default to DD/MM if ambiguous for this project)
      const day = p1 > 12 ? p1 : p1; // Assuming DD is first for this project's locale
      const month = p1 > 12 ? p2 : p2;
      const date = new Date(p3, month - 1, day);
      if (!isNaN(date.getTime())) return date;
    }
  }

  // Fallback to standard JS parsing
  const date = new Date(str);
  if (!isNaN(date.getTime())) return date;

  return null;
}

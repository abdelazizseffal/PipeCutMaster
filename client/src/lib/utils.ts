import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number, decimalPlaces = 2): string {
  return num.toFixed(decimalPlaces);
}

export function formatPercent(value: number, decimalPlaces = 1): string {
  return `${value.toFixed(decimalPlaces)}%`;
}

export function calculateEfficiency(
  stockLength: number,
  usedLength: number
): number {
  if (stockLength <= 0) return 0;
  return (usedLength / stockLength) * 100;
}

/**
 * Export data as a CSV file
 */
export function exportToCSV(
  data: any[][],
  filename: string,
  headers?: string[]
): void {
  // Create CSV content
  let csvContent = "";

  // Add headers if provided
  if (headers && headers.length > 0) {
    csvContent += headers.join(",") + "\n";
  }

  // Add data rows
  data.forEach((row) => {
    csvContent += row.join(",") + "\n";
  });

  // Create a blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format a cutting pattern for display
 */
export function formatCuttingPattern(segments: any[]): string {
  const usedSegments = segments
    .filter((s) => !s.isWaste)
    .map((s) => `${s.length}m`);
  
  const waste = segments.find((s) => s.isWaste);
  
  let pattern = usedSegments.join(" + ");
  
  if (waste && waste.length > 0) {
    pattern += ` + ${waste.length}m (leftover)`;
  }
  
  return pattern;
}

/**
 * Print the current window content
 */
export function printPage(): void {
  window.print();
}

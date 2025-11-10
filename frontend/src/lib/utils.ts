import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSearchParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (typeof window !== "undefined") {
    const queryString = url.split("?")[1];
    if (queryString) {
      const urlParams = new URLSearchParams(queryString);
      urlParams.forEach((value, key) => {
        params[key] = value;
      });
    }
  }
  return params;
}

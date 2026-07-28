/**
 * Centralized Application Configuration & Environment Variable Access
 */
export const API_URL: string = (
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000"
).replace(/\/+$/, "");

export const EMAILJS_SERVICE_ID: string =
  (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID || "";

export const EMAILJS_TEMPLATE_ID: string =
  (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID || "";

export const EMAILJS_PUBLIC_KEY: string =
  (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY || "";

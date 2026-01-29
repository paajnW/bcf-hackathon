export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:6969";

export const USE_MOCK =
  (import.meta.env.VITE_USE_MOCK || "true") === "true";

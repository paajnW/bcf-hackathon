import { API_BASE_URL } from "../config/env";

/**
 * Simple JSON fetch wrapper:
 * - adds base URL
 * - sets JSON headers by default
 * - throws readable errors
 */
export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  // Try to parse JSON; fallback to text for error messages
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    const errBody = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => "");
    const message =
      (typeof errBody === "string" && errBody) ||
      errBody?.message ||
      `Request failed: ${res.status}`;
    throw new Error(message);
  }

  return isJson ? res.json() : res.text();
}

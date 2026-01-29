import { USE_MOCK } from "../config/env";
import { apiFetch } from "../api/http";
import { mockGenerateResponse } from "../data/mockGenerate";

/**
 * mode: "theory" | "lab"
 * Later backend: POST /generate  body: { mode, prompt, language? }
 */
export async function generateMaterial({ mode = "theory", prompt, language }) {
  if (USE_MOCK) {
    const key = mode === "lab" ? "lab" : "theory";
    // (Optional) you can vary output based on prompt later
    return mockGenerateResponse[key];
  }

  return apiFetch("/generate", {
    method: "POST",
    body: JSON.stringify({ mode, prompt, language }),
  });
}

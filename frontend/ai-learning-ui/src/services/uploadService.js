import { USE_MOCK } from "../config/env";
import { apiFetch } from "../api/http";

export async function uploadMaterial(formData) {
  if (USE_MOCK) {
    // simulate latency + success
    await new Promise((r) => setTimeout(r, 700));
    return { ok: true, id: "mock-upload-1" };
  }

  // backend: POST /materials/upload (example)
  return apiFetch("/materials/upload", {
    method: "POST",
    body: formData, // NOTE: no JSON header needed for FormData
    headers: {},    // let browser set multipart boundary
  });
}

import { USE_MOCK } from "../config/env";
import { apiFetch } from "../api/http";
import { mockCourses } from "../data/mockCourses";

// Later: same function will fetch from DB via backend
export async function getCourses() {
  if (USE_MOCK) {
    return mockCourses;
  }
  // backend should return: [{ id, code, title }, ...]
  return apiFetch("/courses");
}

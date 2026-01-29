import { USE_MOCK } from "../config/env";
import { apiFetch } from "../api/http";
import { mockCourseMaterials } from "../data/mockCourseMaterials";

/**
 * Get course topics/materials for the Course page.
 * Later backend: GET /courses/:id/materials
 */
export async function getCourseMaterials(courseId) {
  if (USE_MOCK) {
    return mockCourseMaterials[courseId] || [];
  }

  // expected backend response:
  // [{ id, week, topic, contents: [{ id, type, title, url?, tags? }, ...] }, ...]
  return apiFetch(`/courses/${courseId}/materials`);
}

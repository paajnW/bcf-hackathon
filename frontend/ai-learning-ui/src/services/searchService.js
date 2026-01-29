import { USE_MOCK } from "../config/env";
import { apiFetch } from "../api/http";
import { mockSearchResults } from "../data/mockSearchResults";

/**
 * Search course materials (Theory/Lab).
 * Later backend will do semantic/RAG search.
 */
export async function searchMaterials({ query, scope = "all" }) {
  if (USE_MOCK) {
    const q = (query || "").toLowerCase().trim();
    if (!q) return [];

    return mockSearchResults
      .filter((r) => (scope === "all" ? true : r.type.toLowerCase() === scope))
      .filter((r) => r.snippet.toLowerCase().includes(q) || r.source.toLowerCase().includes(q));
  }

  // backend suggested shape:
  // POST /search  body: { query, scope }
  // returns: [{ id, snippet, source, type, meta }]
  return apiFetch("/search", {
    method: "POST",
    body: JSON.stringify({ query, scope }),
  });
}

import { USE_MOCK } from "../config/env";
import { apiFetch } from "../api/http";

import { searchMaterials } from "./searchService";
import { generateMaterial } from "./generateService";
import { mockChatReplies } from "../data/mockChat";

// helper to format search results nicely for chat
function formatSearchResults(results) {
  if (!results || results.length === 0) {
    return { text: "No results found.", citations: [] };
  }

  const top = results.slice(0, 4);
  const text =
    "Top results:\n" +
    top
      .map(
        (r, i) =>
          `${i + 1}) ${r.snippet}\n   • ${r.source} (${r.type})${
            r.meta?.page ? ` • Page ${r.meta.page}` : ""
          }${r.meta?.lineStart ? ` • Lines ${r.meta.lineStart}-${r.meta.lineEnd}` : ""}`
      )
      .join("\n\n");

  // build citations from results (use url if your results have it later)
  const citations = top.map((r) => ({
    source: r.source,
    detail: r.type === "Lab" ? "Code snippet match" : "Document match",
    page: r.meta?.page,
    lineStart: r.meta?.lineStart,
    lineEnd: r.meta?.lineEnd,
    url: r.url, // optional
  }));

  return { text, citations };
}

export async function sendChatMessage({ messages, context }) {
  // LIVE mode → backend handles everything
  if (!USE_MOCK) {
    return apiFetch("/chat", {
      method: "POST",
      body: JSON.stringify({ messages, context }),
    });
  }

  // MOCK mode → actually run our local services (search/generate) to feel real
  const last = (messages[messages.length - 1]?.text || "").trim();
  const lower = last.toLowerCase();

  // /search ...
  if (lower.startsWith("/search")) {
    const query = last.replace(/^\/search/i, "").trim();
    const results = await searchMaterials({ query, scope: "all" });
    return formatSearchResults(results);
  }

  // /generate theory ...
  if (lower.startsWith("/generate theory")) {
    const prompt = last.replace(/^\/generate\s+theory/i, "").trim();
    const out = await generateMaterial({ mode: "theory", prompt });
    return {
      text: out.content || "Generated theory output.",
      citations: out.citations || [],
    };
  }

  // /generate lab ...
  if (lower.startsWith("/generate lab")) {
    const prompt = last.replace(/^\/generate\s+lab/i, "").trim();
    const out = await generateMaterial({ mode: "lab", prompt, language: "Java" });
    return {
      text: out.content || "Generated lab output.",
      citations: out.citations || [],
    };
  }

  // /summarize ...
  if (lower.startsWith("/summarize")) {
    // you can upgrade this later; for now keep a grounded-ish mock
    return mockChatReplies.summarize;
  }

  return mockChatReplies.fallback;
}

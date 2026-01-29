import { useState } from "react";
import { searchMaterials } from "../services/searchService";

export default function Search() {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("all"); // all | theory | lab

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await searchMaterials({ query, scope });
      setResults(data);
    } catch (e) {
      setError(e.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const ScopeButton = ({ value, label }) => {
    const active = scope === value;
    return (
      <button
        type="button"
        onClick={() => setScope(value)}
        className={`px-3 py-2 rounded-lg text-sm border transition ${
          active
            ? "bg-indigo-600 text-white border-indigo-600"
            : "bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Smart Search</h1>
          <p className="text-gray-500 text-sm mt-1">
            Search slides, PDFs, notes, and lab code using natural language.
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try: "deadlock conditions" or "producer consumer code"'
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />

          <button
            onClick={handleSearch}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Scope toggle */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <ScopeButton value="all" label="All" />
          <ScopeButton value="theory" label="Theory" />
          <ScopeButton value="lab" label="Lab" />
        </div>
      </div>

      {/* States */}
      {error && (
        <div className="mt-4 bg-red-50 text-red-700 border border-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && results.length === 0 && query.trim() && (
        <div className="mt-4 text-gray-600">No results found.</div>
      )}

      {/* Results */}
      <div className="mt-6 space-y-4">
        {results.map((res) => (
          <div
            key={res.id || `${res.source}-${res.snippet}`}
            className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-gray-800">{res.snippet}</p>

                <div className="text-sm text-gray-500 mt-2">
                  Source: <span className="font-medium">{res.source}</span>
                  {res.meta?.week ? <span> • Week {res.meta.week}</span> : null}
                  {res.meta?.page ? <span> • Page {res.meta.page}</span> : null}
                  {res.meta?.lineStart ? (
                    <span>
                      {" "}
                      • Lines {res.meta.lineStart}-{res.meta.lineEnd}
                    </span>
                  ) : null}
                </div>
              </div>

              <span
                className={`shrink-0 text-xs px-2 py-1 rounded-full ${
                  (res.type || "").toLowerCase() === "lab"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-purple-100 text-purple-800"
                }`}
              >
                {res.type || "Theory"}
              </span>
            </div>

            {/* Future: add buttons like "Open Source" / "Ask Chat" */}
          </div>
        ))}
      </div>
    </div>
  );
}

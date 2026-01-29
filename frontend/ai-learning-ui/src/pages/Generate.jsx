import { useState } from "react";
import { generateMaterial } from "../services/generateService";

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm border transition ${
        active
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

export default function Generate() {
  const [mode, setMode] = useState("theory"); // theory | lab
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("Java");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError("");
      setResult(null);

      const data = await generateMaterial({
        mode,
        prompt,
        language: mode === "lab" ? language : undefined,
      });

      setResult(data);
    } catch (e) {
      setError(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Generate Learning Material</h1>
          <p className="text-gray-500 text-sm mt-1">
            Generate notes (Theory) or code-centric materials (Lab), grounded in course content.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <Pill active={mode === "theory"} onClick={() => setMode("theory")}>
            Theory
          </Pill>
          <Pill active={mode === "lab"} onClick={() => setMode("lab")}>
            Lab
          </Pill>
        </div>

        <div className="mt-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              mode === "theory"
                ? 'Example: "Explain deadlocks and prevention techniques"'
                : 'Example: "Generate producer-consumer code using semaphores"'
            }
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={4}
          />
        </div>

        {mode === "lab" && (
          <div className="mt-3 flex items-center gap-3">
            <label className="text-sm text-gray-600">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option>Java</option>
              <option>C</option>
              <option>C++</option>
              <option>Python</option>
              <option>JavaScript</option>
            </select>
            <span className="text-xs text-gray-500">
              (Supported languages should match backend later)
            </span>
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 text-red-700 border border-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Output */}
      {result && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 bg-white border rounded-xl shadow-sm p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="text-xl font-semibold">Generated Output</h2>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  mode === "lab"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-purple-100 text-purple-800"
                }`}
              >
                {mode === "lab" ? `Lab • ${result.language || language}` : "Theory"}
              </span>
            </div>

            {mode === "lab" ? (
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                <pre className="whitespace-pre">{result.content}</pre>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-gray-800">{result.content}</pre>
            )}
          </div>

          {/* Validation + citations */}
          <div className="bg-white border rounded-xl shadow-sm p-5">
            <h3 className="font-semibold mb-3">Validation</h3>

            {mode === "theory" ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Grounded</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      result.validation?.grounded
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {result.validation?.grounded ? "Yes ✅" : "Partial ⚠️"}
                  </span>
                </div>
                <div className="text-gray-600">
                  Grounded score:{" "}
                  <span className="font-medium">
                    {result.validation?.groundedScore ?? "—"}
                  </span>
                </div>
                <div className="text-gray-500 text-xs">
                  {result.validation?.notes}
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Syntax</span>
                  <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    {result.validation?.syntax || "pass"} ✅
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tests</span>
                  <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    {result.validation?.tests || "pass"} ✅
                  </span>
                </div>
                <div className="text-gray-500 text-xs">
                  {result.validation?.notes}
                </div>
              </div>
            )}

            <hr className="my-4" />

            <h3 className="font-semibold mb-2">Sources</h3>
            <div className="space-y-2">
              {(result.citations || []).length === 0 ? (
                <div className="text-sm text-gray-500">No citations returned.</div>
              ) : (
                result.citations.map((c, idx) => (
                  <div
                    key={idx}
                    className="text-sm bg-gray-50 border rounded-lg p-3"
                  >
                    <div className="font-medium text-gray-800">{c.source}</div>
                    <div className="text-gray-600 text-xs mt-1">
                      {c.detail}
                      {c.page ? ` • Page ${c.page}` : ""}
                      {c.lineStart ? ` • Lines ${c.lineStart}-${c.lineEnd}` : ""}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

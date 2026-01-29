import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getCourseMaterials } from "../services/courseMaterialService";

function TypeBadge({ type }) {
    const t = (type || "").toLowerCase();
    const cls =
        t === "code"
            ? "bg-blue-100 text-blue-800"
            : t === "pdf"
                ? "bg-red-100 text-red-800"
                : "bg-purple-100 text-purple-800";

    return (
        <span className={`text-xs px-2 py-1 rounded-full ${cls}`}>{type}</span>
    );
}

export default function Course() {
    const { id } = useParams(); // courseId
    const courseId = String(id);

    const [topics, setTopics] = useState([]);
    const [selected, setSelected] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setLoading(true);
                setError("");
                const data = await getCourseMaterials(courseId);
                if (!mounted) return;
                setTopics(data);

                // auto-select first item for nicer UX
                const first = data?.[0]?.contents?.[0];
                if (first) {
                    setSelected({
                        ...first,
                        week: data[0].week,
                        topic: data[0].topic,
                    });
                } else {
                    setSelected(null);
                }
            } catch (e) {
                if (mounted) setError(e.message || "Failed to load course materials");
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [courseId]);

    const flatIndex = useMemo(() => {
        // Create a quick lookup for rendering selection info
        const items = [];
        for (const t of topics) {
            for (const c of t.contents || []) {
                items.push({
                    ...c,
                    week: t.week,
                    topic: t.topic,
                });
            }
        }
        return items;
    }, [topics]);

    const handleSelect = (contentId) => {
        const item = flatIndex.find((x) => x.id === contentId);
        if (item) setSelected(item);
    };

    return (
        <div className="flex gap-6">
            {/* Sidebar */}
            <aside className="w-72 shrink-0">
                <div className="bg-white border rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-lg">Topics</h2>
                        <span className="text-xs text-gray-500">Course #{courseId}</span>
                    </div>

                    {loading && <div className="text-gray-600 text-sm">Loading…</div>}

                    {!loading && error && (
                        <div className="text-sm bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {!loading && !error && topics.length === 0 && (
                        <div className="text-gray-600 text-sm">
                            No materials found for this course.
                        </div>
                    )}

                    {!loading && !error && (
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                            {topics.map((t) => (
                                <div key={t.id} className="border rounded-lg p-3">
                                    <div className="text-sm text-gray-500">Week {t.week}</div>
                                    <div className="font-semibold">{t.topic}</div>

                                    <ul className="mt-2 space-y-1">
                                        {(t.contents || []).map((c) => {
                                            const active = selected?.id === c.id;
                                            return (
                                                <li
                                                    key={c.id}
                                                    onClick={() => handleSelect(c.id)}
                                                    className={`cursor-pointer rounded-md px-2 py-2 text-sm transition flex items-center justify-between gap-2 ${active
                                                        ? "bg-indigo-50 text-indigo-700"
                                                        : "hover:bg-gray-50 text-gray-700"
                                                        }`}
                                                >
                                                    <span className="truncate">
                                                        {c.title}
                                                    </span>
                                                    <TypeBadge type={c.type} />
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 min-w-0">
                <div className="bg-white border rounded-xl shadow-sm p-6">
                    <h1 className="text-2xl font-bold mb-1">Course Content</h1>
                    <p className="text-gray-500 text-sm mb-6">
                        Select a topic on the left to view slides, PDFs, or lab code.
                    </p>

                    {!selected ? (
                        <div className="text-gray-600">No content selected.</div>
                    ) : (
                        <div className="border rounded-xl p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-sm text-gray-500">
                                        Week {selected.week} • {selected.topic}
                                    </div>
                                    <h2 className="text-xl font-semibold mt-1 truncate">
                                        {selected.title}
                                    </h2>
                                </div>
                                <TypeBadge type={selected.type} />
                            </div>

                            <div className="mt-4 text-sm text-gray-600">
                                {/* Placeholder preview area */}
                                {selected.type === "Code" ? (
                                    <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                                        <pre className="whitespace-pre">
                                            {`// Preview (mock)
// Later: render code snippet / open file
public class Example {
  public static void main(String[] args) {
    System.out.println("Hello Lab!");
  }
}`}
                                        </pre>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 border rounded-lg p-4">
                                        <p className="text-gray-700">
                                            Preview placeholder. Later you can open a PDF/slide viewer
                                            or download the file from backend.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {selected?.url ? (
                                    <>
                                        <a
                                            href={selected.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                                        >
                                            Open
                                        </a>

                                        <a
                                            href={selected.url}
                                            download
                                            className="bg-white border px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                                        >
                                            Download
                                        </a>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => alert("File URL not available yet (backend will provide it).")}
                                        className="bg-white border px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                                    >
                                        Download
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        if (!selected) return;

                                        const cmd =
                                            selected.type === "Code"
                                                ? `/search ${selected.topic || ""} code in ${selected.title}`
                                                : `/summarize ${selected.title}`;

                                        window.dispatchEvent(
                                            new CustomEvent("chat:prefill", {
                                                detail: {
                                                    text: cmd,
                                                    autoSend: true,
                                                },
                                            })
                                        );
                                    }}
                                    className="bg-white border px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Ask Chat about this
                                </button>

                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

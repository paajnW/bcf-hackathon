import { useEffect, useState } from "react";
import { uploadMaterial } from "../services/uploadService";
import { getCourses } from "../services/courseService";

export default function AdminUpload() {
  const [file, setFile] = useState(null);

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [courseId, setCourseId] = useState("");
  const [category, setCategory] = useState("theory"); // theory | lab
  const [week, setWeek] = useState(1);
  const [topic, setTopic] = useState("");
  const [tags, setTags] = useState("");
  const [contentType, setContentType] = useState("PDF"); // PDF | Slide | Code | Notes

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { ok, message }

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingCourses(true);
        const data = await getCourses();
        if (!mounted) return;

        setCourses(data || []);
        if ((data || []).length > 0) {
          // Default to first course
          setCourseId(String(data[0].id));
        } else {
          setCourseId("");
        }
      } catch (e) {
        if (!mounted) return;
        setCourses([]);
        setCourseId("");
        setStatus({ ok: false, message: e.message || "Failed to load courses." });
      } finally {
        if (mounted) setLoadingCourses(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async () => {
    if (!courseId) {
      setStatus({ ok: false, message: "No course selected." });
      return;
    }
    if (!file) {
      setStatus({ ok: false, message: "Please select a file to upload." });
      return;
    }
    if (!topic.trim()) {
      setStatus({ ok: false, message: "Topic is required." });
      return;
    }

    try {
      setLoading(true);
      setStatus(null);

      const fd = new FormData();
      fd.append("file", file);
      fd.append("courseId", String(courseId));
      fd.append("category", category);
      fd.append("week", String(week));
      fd.append("topic", topic.trim());
      fd.append("tags", tags.trim()); // comma-separated
      fd.append("contentType", contentType);

      const res = await uploadMaterial(fd);

      setStatus({
        ok: true,
        message: `Uploaded successfully ✅ (id: ${res.id || "—"})`,
      });

      // Clear only the file; keep metadata for faster bulk uploads
      setFile(null);
    } catch (e) {
      setStatus({ ok: false, message: e.message || "Upload failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Upload</h1>
          <p className="text-gray-500 text-sm mt-1">
            Upload and organize course materials with metadata (Theory/Lab, week, tags).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload box */}
        <div className="lg:col-span-2 bg-white border rounded-xl shadow-sm p-5">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed rounded-xl p-6 bg-gray-50 text-center"
          >
            <div className="text-gray-800 font-semibold">Drag & drop a file here</div>
            <div className="text-gray-500 text-sm mt-1">
              PDFs, slides, code files, or notes
            </div>

            <div className="mt-4">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-sm"
              />
            </div>

            {file && (
              <div className="mt-4 text-sm">
                <span className="font-medium text-gray-700">Selected:</span>{" "}
                <span className="text-gray-600">{file.name}</span>
              </div>
            )}
          </div>

          {status && (
            <div
              className={`mt-4 p-4 rounded-lg border ${
                status.ok
                  ? "bg-green-50 text-green-800 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {status.message}
            </div>
          )}

          <div className="mt-5 flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={loading || loadingCourses}
              className="bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              {loading ? "Uploading..." : "Upload"}
            </button>

            <button
              onClick={() => {
                setFile(null);
                setStatus(null);
              }}
              className="bg-white border px-5 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Metadata panel */}
        <div className="bg-white border rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-lg mb-4">Metadata</h2>

          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Course</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 bg-white text-sm"
                disabled={loadingCourses}
              >
                {loadingCourses ? (
                  <option>Loading courses...</option>
                ) : courses.length === 0 ? (
                  <option>No courses available</option>
                ) : (
                  courses.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.code} — {c.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600">Category</label>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setCategory("theory")}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm transition ${
                    category === "theory"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  Theory
                </button>
                <button
                  type="button"
                  onClick={() => setCategory("lab")}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm transition ${
                    category === "lab"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  Lab
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600">Week</label>
              <input
                type="number"
                min={1}
                value={week}
                onChange={(e) => setWeek(Number(e.target.value))}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Topic</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Deadlocks"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Tags</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="comma-separated e.g., os, concurrency"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Content Type</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 bg-white text-sm"
              >
                <option>PDF</option>
                <option>Slide</option>
                <option>Code</option>
                <option>Notes</option>
              </select>
            </div>

            <div className="text-xs text-gray-500 pt-2">
              Backend will store this metadata for search, RAG grounding, and validation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

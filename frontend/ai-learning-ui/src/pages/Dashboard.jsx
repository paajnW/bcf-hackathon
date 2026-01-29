import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCourses } from "../services/courseService";

export default function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getCourses();
        if (mounted) setCourses(data);
      } catch (e) {
        if (mounted) setError(e.message || "Failed to load courses");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-gray-500 text-sm mt-1">
            Browse course materials, search, and generate learning resources.
          </p>
        </div>

        <Link
          to="/search"
          className="hidden sm:inline-flex bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Smart Search
        </Link>
      </div>

      {loading && <div className="text-gray-600">Loading courses…</div>}

      {!loading && error && (
        <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition"
            >
              <h2 className="font-semibold text-xl mb-2">{course.title}</h2>
              <p className="text-gray-500 mb-4">
                Course Code: {course.code}
              </p>

              <Link
                to={`/course/${course.id}`}
                className="inline-flex bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
              >
                Open Course
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

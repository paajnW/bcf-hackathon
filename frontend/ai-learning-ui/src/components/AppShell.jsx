import { Link, NavLink } from "react-router-dom";

const navLinkClass = ({ isActive }) =>
  `block px-3 py-2 rounded-md text-sm font-medium transition ${
    isActive
      ? "bg-indigo-600 text-white shadow"
      : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
  }`;

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="h-16 bg-white border-b">
        <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white grid place-items-center font-bold">
              AI
            </div>
            <div className="leading-tight">
              <div className="font-bold text-gray-900">AI Learning</div>
              <div className="text-xs text-gray-500 -mt-0.5">
                Supplementary Platform
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700">
              Student Mode
            </span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="hidden md:block w-64">
          <div className="bg-white border rounded-xl p-3 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 px-2 py-2">
              Navigation
            </div>
            <nav className="space-y-1">
              <NavLink to="/dashboard" className={navLinkClass}>
                📚 Courses
              </NavLink>
              <NavLink to="/search" className={navLinkClass}>
                🔎 Smart Search
              </NavLink>
              <NavLink to="/generate" className={navLinkClass}>
                ✨ Generate
              </NavLink>
            </nav>

            <div className="mt-5 border-t pt-4">
              <div className="text-xs font-semibold text-gray-500 px-2 py-2">
                Quick Tips
              </div>
              <ul className="text-xs text-gray-600 space-y-2 px-2">
                <li>• Search by concept, not file name</li>
                <li>• Generate notes/code with citations</li>
                <li>• Chat uses course materials</li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <div className="bg-white border rounded-xl shadow-sm p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Course from "./pages/Course";
import Search from "./pages/Search";
import Generate from "./pages/Generate";
import AdminUpload from "./pages/AdminUpload";

import ChatWidget from "./components/ChatWidget";
import AppShell from "./components/AppShell";

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-indigo-600 mb-2">404</h1>
        <p className="text-gray-600">Page not found</p>
      </div>
    </div>
  );
}

const WithShell = (Page) => (
  <AppShell>
    <Page />
  </AppShell>
);

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Landing stays clean/full */}
        <Route path="/" element={<Landing />} />

        {/* Everything else uses the app shell */}
        <Route path="/dashboard" element={WithShell(Dashboard)} />
        <Route path="/course/:id" element={WithShell(Course)} />
        <Route path="/search" element={WithShell(Search)} />
        <Route path="/generate" element={WithShell(Generate)} />
        <Route path="/adminUpload" element={WithShell(AdminUpload)} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <ChatWidget />
    </Router>
  );
}

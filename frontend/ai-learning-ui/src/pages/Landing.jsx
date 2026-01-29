import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="flex flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-white p-8">
      <h1 className="text-5xl font-bold text-indigo-700 mb-4">
        AI-Powered Learning Platform
      </h1>
      <p className="text-gray-700 text-lg mb-8 text-center max-w-xl">
        Organize your course materials, generate AI-based notes and code, and
        interact with a smart chat assistant — all in one place.
      </p>

      <div className="flex gap-4 flex-wrap justify-center mb-12">
        <div className="bg-white shadow-md p-6 rounded-lg w-60 text-center hover:shadow-xl transition">
          <h2 className="font-semibold text-lg mb-2">Smart Search</h2>
          <p className="text-gray-500 text-sm">
            Search slides, PDFs, and lab codes using natural language.
          </p>
        </div>
        <div className="bg-white shadow-md p-6 rounded-lg w-60 text-center hover:shadow-xl transition">
          <h2 className="font-semibold text-lg mb-2">AI Notes</h2>
          <p className="text-gray-500 text-sm">
            Generate structured notes, slides, and PDFs from your course.
          </p>
        </div>
        <div className="bg-white shadow-md p-6 rounded-lg w-60 text-center hover:shadow-xl transition">
          <h2 className="font-semibold text-lg mb-2">AI Lab Code</h2>
          <p className="text-gray-500 text-sm">
            Generate syntactically correct lab code in supported languages.
          </p>
        </div>
        <div className="bg-white shadow-md p-6 rounded-lg w-60 text-center hover:shadow-xl transition">
          <h2 className="font-semibold text-lg mb-2">Chat Assistant</h2>
          <p className="text-gray-500 text-sm">
            Ask follow-up questions and get AI-generated explanations.
          </p>
        </div>
      </div>

      <Link
        to="/dashboard"
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
      >
        Explore Courses
      </Link>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { sendChatMessage } from "../services/chatService";

function Bubble({ role, text, citations }) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm border ${
          isUser
            ? "bg-indigo-600 text-white border-indigo-600"
            : "bg-white text-gray-800 border-gray-200"
        }`}
      >
        <div className="whitespace-pre-wrap">{text}</div>

        {!isUser && citations && citations.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs font-semibold text-gray-500 mb-1">
              Sources
            </div>
            <div className="space-y-2">
              {citations.map((c, idx) => (
                <div
                  key={idx}
                  className="text-xs bg-gray-50 border rounded-lg px-2 py-2"
                >
                  <div className="font-medium text-gray-700">{c.source}</div>

                  <div className="text-gray-500 mt-0.5">
                    {c.detail}
                    {c.page ? ` • Page ${c.page}` : ""}
                    {c.lineStart
                      ? ` • Lines ${c.lineStart}-${c.lineEnd}`
                      : ""}
                  </div>

                  {c.url ? (
                    <div className="mt-2 flex gap-2">
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition"
                      >
                        Open
                      </a>
                      <a
                        href={c.url}
                        download
                        className="inline-flex items-center px-2 py-1 rounded-md bg-white border hover:bg-gray-100 transition"
                      >
                        Download
                      </a>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  // message: { role: "user"|"assistant"|"tool", text, citations? }
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        "Hi! I can help you search and generate grounded course materials.\n\nTry:\n/search deadlock\n/summarize Week1_Slides.pdf\n/generate theory deadlocks\n/generate lab producer-consumer java",
      citations: [],
    },
  ]);

  const listRef = useRef(null);

  const context = useMemo(() => {
    // later you can inject real courseId from route/store if you want
    return { courseId: "1" };
  }, []);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    });
  };

  const inferToolStatus = (text) => {
    const t = (text || "").toLowerCase().trim();
    if (t.startsWith("/search")) return "Searching course materials…";
    if (t.startsWith("/summarize")) return "Summarizing selected material…";
    if (t.startsWith("/generate theory")) return "Generating theory notes…";
    if (t.startsWith("/generate lab")) return "Generating lab code…";
    return "Thinking…";
  };

  // Core send function (used by button AND course->chat prefill)
  const sendText = async (text) => {
    const clean = (text || "").trim();
    if (!clean || busy) return;

    const userMsg = { role: "user", text: clean };
    const toolMsg = { role: "tool", text: inferToolStatus(clean) };

    setBusy(true);
    setMessages((prev) => [...prev, userMsg, toolMsg]);
    scrollToBottom();

    try {
      // Build convo for backend/ai (exclude tool messages)
      const convo = [...messages, userMsg]
        .filter((m) => m.role !== "tool")
        .map((m) => ({
          role: m.role,
          text: m.text,
          citations: m.citations || [],
        }));

      const reply = await sendChatMessage({ messages: convo, context });

      setMessages((prev) => {
        const copy = [...prev];
        // remove last tool message if present
        if (copy.length && copy[copy.length - 1].role === "tool") copy.pop();

        copy.push({
          role: "assistant",
          text: reply.text,
          citations: reply.citations || [],
        });
        return copy;
      });
    } catch (e) {
      setMessages((prev) => {
        const copy = [...prev];
        if (copy.length && copy[copy.length - 1].role === "tool") copy.pop();
        copy.push({
          role: "assistant",
          text: `Sorry — something went wrong.\n${e.message || "Chat failed"}`,
          citations: [],
        });
        return copy;
      });
    } finally {
      setBusy(false);
      scrollToBottom();
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendText(text);
  };

  // ✅ Course -> Chat integration:
  // window.dispatchEvent(new CustomEvent("chat:prefill", { detail: { text, autoSend } }))
  useEffect(() => {
    const handler = (e) => {
      const { text, autoSend } = e.detail || {};
      if (!text) return;

      setOpen(true);

      if (autoSend) {
        sendText(text);
      } else {
        setInput(text);
      }
    };

    window.addEventListener("chat:prefill", handler);
    return () => window.removeEventListener("chat:prefill", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, messages]);

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 w-[360px] h-[520px] bg-white border shadow-xl rounded-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="font-semibold">AI Assistant</div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/90 hover:text-white text-sm"
            >
              Close
            </button>
          </div>

          {/* Messages */}
          <div
            ref={listRef}
            className="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-50"
          >
            {messages.map((m, idx) =>
              m.role === "tool" ? (
                <div key={idx} className="text-center text-xs text-gray-500">
                  {m.text}
                </div>
              ) : (
                <Bubble
                  key={idx}
                  role={m.role}
                  text={m.text}
                  citations={m.citations}
                />
              )
            )}
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder='Type a message or try "/search deadlock"...'
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSend}
                disabled={busy}
                className="bg-indigo-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Send
              </button>
            </div>

            <div className="mt-2 text-xs text-gray-500">
              Commands: <span className="font-mono">/search</span>,{" "}
              <span className="font-mono">/summarize</span>,{" "}
              <span className="font-mono">/generate theory</span>,{" "}
              <span className="font-mono">/generate lab</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-indigo-700 transition"
      >
        {open ? "Chat Open" : "Chat"}
      </button>
    </>
  );
}

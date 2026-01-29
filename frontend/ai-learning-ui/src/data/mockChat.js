export const mockChatReplies = {
  search: {
    text: "I searched your course materials and found the most relevant snippets.",
    citations: [
      { source: "Week1_Slides.pdf", detail: "Deadlock overview", page: 12, url: "/mock/Week1_Slides.pdf" },
      { source: "Lab1_Code.java", detail: "Semaphore usage", lineStart: 18, lineEnd: 42, url: "/mock/Deadlock.java" },
    ],
  },
  summarize: {
    text: "Summary (Week 1 — Deadlocks):\n- Deadlock definition\n- Coffman conditions\n- Prevention strategies\n- Detection & recovery overview",
    citations: [{ source: "Week1_Slides.pdf", detail: "Summary points", page: 10, url: "/mock/Week1_Slides.pdf" }],
  },
  generateTheory: {
    text: "Generated theory notes for your topic (grounded in course materials).",
    citations: [{ source: "Deadlock Notes.pdf", detail: "Coffman conditions", page: 3, url: "/mock/Deadlock_Notes.pdf" }],
  },
  generateLab: {
    text: "Generated lab code outline (syntactically correct template).",
    citations: [{ source: "Lab1_Code.java", detail: "Code pattern reference", lineStart: 18, lineEnd: 42, url: "/mock/Deadlock.java" }],
  },
  fallback: {
    text: "I can help with /search, /summarize, or /generate. Try:\n/search deadlock\n/summarize Week1_Slides.pdf\n/generate theory deadlocks\n/generate lab producer-consumer java",
    citations: [],
  },
};

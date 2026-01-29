export const mockGenerateResponse = {
  theory: {
    content: `# Deadlocks — Quick Notes

## 1) What is a deadlock?
A deadlock happens when multiple processes are **stuck** because each one is waiting for a resource held by another process.

## 2) Coffman conditions (must all be true)
1. **Mutual exclusion**
2. **Hold and wait**
3. **No preemption**
4. **Circular wait**

## 3) Simple example
- P1 holds Resource A and waits for B  
- P2 holds Resource B and waits for A  
→ both are stuck.

## 4) Prevention ideas
- Break circular wait (resource ordering)
- Allow preemption (if possible)

`,
    citations: [
      { source: "Week1_Slides.pdf", detail: "Deadlocks overview", page: 12 },
      { source: "Deadlock Notes.pdf", detail: "Coffman conditions", page: 3 },
    ],
    validation: {
      groundedScore: 0.86,
      grounded: true,
      notes: "All key points matched uploaded course material excerpts.",
    },
  },

  lab: {
    content: `// Java: Producer-Consumer using Semaphore (simplified)
import java.util.concurrent.Semaphore;

class Buffer {
  int item = 0;
  Semaphore empty = new Semaphore(1);
  Semaphore full = new Semaphore(0);

  public void produce(int x) throws InterruptedException {
    empty.acquire();
    item = x;
    full.release();
  }

  public int consume() throws InterruptedException {
    full.acquire();
    int x = item;
    empty.release();
    return x;
  }
}
`,
    citations: [
      { source: "Lab1_Code.java", detail: "Semaphore example", lineStart: 18, lineEnd: 42 },
    ],
    validation: {
      syntax: "pass",
      tests: "pass",
      notes: "Syntactically valid Java. Ready for compilation/linting later.",
    },
    language: "Java",
  },
};

import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Mode = "explain" | "practice" | "summary" | null;

function detectTopic(text: string): string | null {
  const m = text.toLowerCase();
  if (m.includes("derivative") || m.includes("derivatives")) return "derivatives";
  if (m.includes("integral") || m.includes("integration")) return "integrals";
  if (m.includes("limit") || m.includes("limits")) return "limits";
  if (m.includes("matrix") || m.includes("matrices") || m.includes("linear algebra")) return "linear algebra";
  if (m.includes("probability") || m.includes("stats") || m.includes("statistics")) return "statistics";
  return null;
}

function detectMode(text: string): Mode {
  const m = text.toLowerCase();
  if (m.includes("explain")) return "explain";
  if (m.includes("practice") || m.includes("questions")) return "practice";
  if (m.includes("summary") || m.includes("summarize") || m.includes("notes")) return "summary";
  return null;
}

function mockStudyAssistant(message: string, history: string[]): string {
  const topicFromMsg = detectTopic(message);
  const modeFromMsg = detectMode(message);

  // Look at the last few user messages to “remember” context
  const recent = history.slice(-6).join(" | ");
  const topicFromHistory = detectTopic(recent);
  const modeFromHistory = detectMode(recent);

  const topic = topicFromMsg ?? topicFromHistory;
  const mode = modeFromMsg ?? modeFromHistory;

  // Greetings
  const clean = message.trim().toLowerCase();
  if (clean === "hi" || clean === "hello") {
    return "Hi! What are you studying today? (example: derivatives) And do you want explain, practice, or summary?";
  }

  // Derivatives flows
  if (topic === "derivatives" && mode === "explain") {
    return (
      "Derivatives tell you the *instant rate of change* (slope) of a function at a point.\n\n" +
      "Quick intuition: if f(x) is position, then f′(x) is speed.\n\n" +
      "Rules you must know:\n" +
      "1) Power: d/dx(x^n) = n·x^(n−1)\n" +
      "2) Constant: d/dx(c) = 0\n" +
      "3) Sum: d/dx(f+g) = f′+g′\n" +
      "4) Product: (fg)′ = f′g + fg′\n" +
      "5) Quotient: (f/g)′ = (f′g − fg′)/g^2\n" +
      "6) Chain: d/dx f(g(x)) = f′(g(x))·g′(x)\n\n" +
      "Send ONE function and I’ll do it step-by-step (example: 3x^2+5x, or sin(x^2))."
    );
  }

  if (topic === "derivatives" && mode === "practice") {
    return (
      "Practice (reply with your answers):\n" +
      "1) d/dx(5x^3)\n" +
      "2) d/dx(x^2 + 4x + 7)\n" +
      "3) d/dx(sin x)\n" +
      "4) d/dx(sin(x^2))  (chain rule)\n"
    );
  }

  if (topic === "derivatives" && mode === "summary") {
    return (
      "Derivative summary:\n" +
      "- Meaning: slope / rate of change\n" +
      "- Power: (x^n)' = n x^(n−1)\n" +
      "- Product: (fg)' = f'g + fg'\n" +
      "- Quotient: (f/g)' = (f'g − fg')/g^2\n" +
      "- Chain: f(g(x))' = f'(g(x)) g'(x)\n\n" +
      "Want 5 quick examples to memorize?"
    );
  }

  // If they gave a topic but not mode
  if (topic && !mode) {
    return `Got it: **${topic}**. Do you want **explain**, **practice**, or a **summary**?`;
  }

  // If they gave a mode but not topic
  if (!topic && mode) {
    return `Cool — you want **${mode}**. What topic? (example: derivatives, integrals, limits)`;
  }

  // Default
  return "Tell me: (1) topic, and (2) explain/practice/summary. Example: `explain derivatives`.";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body?.message;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const history = Array.isArray(body?.history) ? body.history : [];

    // small delay so your UI “Thinking…” feels smooth
    await new Promise((r) => setTimeout(r, 450));

    const reply = mockStudyAssistant(message, history);

    return NextResponse.json({ reply });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

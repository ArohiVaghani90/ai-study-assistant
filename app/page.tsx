"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Role = "user" | "assistant";
type ChatMsg = { id: string; role: Role; content: string; ts: number };

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: uid(),
      role: "assistant",
      content: "Hi! What are you studying today?",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to newest message (smooth)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);

    const userMsg: ChatMsg = { id: uid(), role: "user", content: text, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");

      const botMsg: ChatMsg = {
        id: uid(),
        role: "assistant",
        content: data.reply,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: "⚠️ I couldn’t reach the AI right now. Check your API route/key.",
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Personal Study Assistant
            </h1>
            <p className="text-sm text-slate-500">
              Ask anything — explanations, practice problems, summaries.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
              <span className={`h-2 w-2 rounded-full ${loading ? "bg-amber-400" : "bg-emerald-400"}`} />
              {loading ? "Thinking…" : "Ready"}
            </span>
          </div>
        </div>
      </header>

      {/* Chat card */}
      <section className="mx-auto max-w-4xl px-4 py-6">
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          {/* Messages */}
          <div className="h-[70vh] overflow-auto p-4 sm:p-6 space-y-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} role={m.role} content={m.content} />
            ))}

            {loading && <TypingBubble />}

            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div className="border-t bg-slate-50/60 p-3 sm:p-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="sr-only" htmlFor="prompt">
                  Your message
                </label>
                <textarea
                  id="prompt"
                  className="w-full resize-none rounded-xl border bg-white px-3 py-2 text-sm shadow-sm
                             outline-none transition
                             focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
                  placeholder="Ask a study question… (Shift+Enter for new line)"
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Tip: “Explain it like I’m new” or “Give me 5 practice questions.”
                </p>
              </div>

              <button
                onClick={sendMessage}
                disabled={!canSend}
                className="rounded-xl px-4 py-2 text-sm font-medium text-white shadow-sm
                           bg-slate-900 transition
                           hover:bg-slate-800 active:scale-[0.98]
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function MessageBubble({ role, content }: { role: Role; content: string }) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} message-pop`}>
      <div
        className={[
          "max-w-[90%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
          "transition-transform duration-200",
          isUser
            ? "bg-slate-900 text-white hover:translate-y-[-1px]"
            : "bg-white border text-slate-800 hover:translate-y-[-1px]",
        ].join(" ")}
      >
        <div className="mb-1 text-[11px] opacity-70">
          {isUser ? "You" : "Assistant"}
        </div>
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start message-pop">
      <div className="max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm border bg-white text-slate-800">
        <div className="mb-1 text-[11px] opacity-70">Assistant</div>
        <div className="flex items-center gap-2">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="text-slate-500">Thinking…</span>
        </div>
      </div>
    </div>
  );
}

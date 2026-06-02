import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Sparkles, Send, Mic, MicOff, ArrowRight, Bot } from "lucide-react";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "NiteshAI — AdhyayX Assistant" },
      { name: "description", content: "Chat with NiteshAI - your friendly exam prep assistant for JEE, NEET, NDA, UPSC & more." },
    ],
  }),
  component: AiPage,
});

interface Test {
  id: string;
  name: string;
  stream: string;
  subject?: string;
  total_questions: number;
  total_marks: number;
}

interface Message {
  role: "user" | "ai";
  text: string;
  tests?: Test[];
}

function AiPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Namaste! Main NiteshAI hoon — AdhyayX ka friendly assistant. Aap mujh se exams, tests, current affairs, daily news, ya is site pe kuch bhi puchh sakte ho!\n\nExamples:\n- NDA ke liye test dikhao\n- NEET mock test chahiye\n- Aaj ki news kya hai\n- Current affairs batao\n- Kya ye site free hai?\n- JEE ke liye batch kaunsa hai?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = (await res.json()) as { reply: string; tests: Test[] };

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: data.reply,
          tests: data.tests?.length ? data.tests : undefined,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Network error aa gayi. Internet check karo aur dobara try karo!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function toggleVoice() {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input supported nahi hai. Chrome use karo!");
      return;
    }

    const recognition = new SR();
    recognition.lang = "hi-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setIsRecording(false);
      sendMessage(transcript);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <div className="flex flex-1 flex-col">
        <section className="border-b-2 border-ink/10 bg-surface">
          <div className="mx-auto max-w-4xl px-5 py-6 sm:px-6 sm:py-8">
            <Link
              to="/categories"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Back
            </Link>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-foreground sm:h-12 sm:w-12">
                <Sparkles className="h-5 w-5 text-background sm:h-6 sm:w-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                  AI Assistant
                </div>
                <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                  NiteshAI
                </h1>
              </div>
            </div>
            <p className="mt-2 max-w-xl text-xs text-muted-foreground sm:text-sm">
              AdhyayX ke baare mein kuch bhi puchho — tests, exams, current affairs, daily news, ya fir kuch bhi!
            </p>
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6 sm:px-6">
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-2">
                  {msg.role === "ai" && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground">
                      <Bot className="h-3.5 w-3.5 text-background" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap sm:text-base ${
                      msg.role === "user"
                        ? "bg-foreground text-background"
                        : "bg-card border-2 border-ink/10 text-foreground"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>

                {msg.role === "ai" && msg.tests && msg.tests.length > 0 && (
                  <div className="ml-8 w-full max-w-lg space-y-2">
                    {msg.tests.slice(0, 6).map((t) => (
                      <Link
                        key={t.id}
                        to="/test/$testId"
                        params={{ testId: t.id }}
                        className="group flex items-center justify-between rounded-xl border-2 border-ink/10 bg-card p-3 transition-all hover:border-foreground hover:shadow-elevated"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-foreground">
                            {t.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t.stream} - {t.total_questions} Qs - {t.total_marks} marks
                          </div>
                        </div>
                        <ArrowRight className="ml-2 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground">
                  <Bot className="h-3.5 w-3.5 text-background" />
                </div>
                <div className="rounded-2xl border-2 border-ink/10 bg-card px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-2 w-2 rounded-full bg-muted-foreground"
                        style={{ animation: `bounce 1.2s infinite ${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t-2 border-ink/10 bg-card p-4">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-end gap-2 rounded-2xl border-2 border-ink/10 bg-background p-2 focus-within:border-foreground">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Apna sawaal likho..."
                  rows={1}
                  className="max-h-32 min-h-[2.5rem] flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none sm:text-base"
                  disabled={isLoading}
                />
                <div className="flex gap-1">
                  <button
                    onClick={toggleVoice}
                    className={`rounded-xl p-2.5 transition-colors ${
                      isRecording
                        ? "text-red-500 animate-pulse"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    title="Voice input"
                    disabled={isLoading}
                  >
                    {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="rounded-xl bg-foreground p-2.5 text-background transition-all hover:opacity-80 disabled:opacity-30"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="mt-2 text-center text-[10px] text-muted-foreground">
                Powered by Gemini AI - NiteshAI for AdhyayX
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

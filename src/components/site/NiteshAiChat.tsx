import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, X, Send, Mic, MicOff, ArrowRight } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────
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

// ── Main Component ────────────────────────────────────────────────
export function NiteshAiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Namaste! 🙏 Main NiteshAI hoon — AdhyayX ka assistant.\n\nKoi bhi exam ya test ke baare mein puchho! Jaise:\n• \"NDA Class 12 test\"\n• \"NEET mock test\"\n• \"JEE mains practice\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Auto scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ── Send message ──────────────────────────────────────────────
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
          text: "Network error aa gayi. Internet check karo aur dobara try karo! 🔌",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // ── Voice input ───────────────────────────────────────────────
  function toggleVoice() {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      alert("Aapka browser voice input support nahi karta. Chrome use karo!");
      return;
    }

    const recognition = new SR() as SpeechRecognition;
    recognition.lang = "hi-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setIsRecording(false);
      // Auto send after voice
      sendMessage(transcript);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <>
      {/* Floating Button — bottom-28 so it stays above PW icon */}
      <div className="fixed bottom-28 right-4 z-40 flex flex-col items-end gap-1">
        {/* NiteshAI label */}
        {!isOpen && (
          <span className="rounded-full border border-ink/10 bg-card px-2 py-0.5 text-[10px] font-bold text-foreground shadow-soft">
            NiteshAI
          </span>
        )}
        <button
          onClick={() => setIsOpen((o) => !o)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-elevated transition-all hover:scale-110 active:scale-95"
          aria-label="NiteshAI chat"
        >
          {isOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-44 right-4 z-40 flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border-2 border-ink/10 bg-card shadow-elevated sm:w-96">

          {/* Header */}
          <div className="flex items-center gap-3 border-b-2 border-ink/10 bg-foreground px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background/20">
              <Sparkles className="h-4 w-4 text-background" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-background">NiteshAI</div>
              <div className="text-[10px] text-background/60">AdhyayX Assistant • Online</div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-background/60 hover:text-background"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3" style={{ maxHeight: "380px", minHeight: "200px" }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                {/* Message bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-foreground text-background"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.text}
                </div>

                {/* Test cards (only for AI messages) */}
                {msg.role === "ai" && msg.tests && msg.tests.length > 0 && (
                  <div className="w-full space-y-1.5">
                    {msg.tests.slice(0, 4).map((t) => (
                      <Link
                        key={t.id}
                        to="/test/$testId"
                        params={{ testId: t.id }}
                        onClick={() => setIsOpen(false)}
                        className="group flex items-center justify-between rounded-xl border border-ink/10 bg-background px-3 py-2 transition-all hover:border-foreground"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-[12px] font-bold text-foreground">
                            {t.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {t.stream} • {t.total_questions} Qs • {t.total_marks} marks
                          </div>
                        </div>
                        <ArrowRight className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Loading dots */}
            {isLoading && (
              <div className="flex items-start">
                <div className="rounded-2xl bg-muted px-3 py-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                        style={{
                          animation: `bounce 1.2s infinite ${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="border-t-2 border-ink/10 p-2">
            <div className="flex items-center gap-1.5 rounded-xl border-2 border-ink/10 bg-background px-2 py-1 focus-within:border-foreground">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Kuch puchho..."
                className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
                disabled={isLoading}
              />
              {/* Voice button */}
              <button
                onClick={toggleVoice}
                className={`rounded-lg p-1.5 transition-colors ${
                  isRecording
                    ? "text-red-500 animate-pulse"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Voice input"
                disabled={isLoading}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
              {/* Send button */}
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="rounded-lg bg-foreground p-1.5 text-background transition-all hover:opacity-80 disabled:opacity-30"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-1 text-center text-[9px] text-muted-foreground">
              Powered by Gemini AI • NiteshAI for AdhyayX
            </div>
          </div>
        </div>
      )}

      {/* Bounce animation for loading dots */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
            }

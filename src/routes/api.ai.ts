import { createFileRoute } from "@tanstack/react-router";

// Supabase config — same as testApi.ts
const SUPA_BASE = "https://gaqyuylvawgoxuaevhsi.supabase.co/rest/v1";
const SUPA_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhcXl1eWx2YXdnb3h1YWV2aHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MDExNTQsImV4cCI6MjA2Nzk3NzE1NH0.tRJXi5vTSopCza_61sYu2ccOrk8LR7UvJ07JPP07OEI";

interface Test {
  id: string;
  name: string;
  stream: string;
  subject?: string;
  total_questions: number;
  total_marks: number;
}

export const Route = createFileRoute("/api/ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { message: string };
          const message = (body.message ?? "").trim();
          if (!message) {
            return new Response(
              JSON.stringify({ reply: "Kuch puchho! Main yahan hoon. 😊", tests: [] }),
              { headers: { "content-type": "application/json" } }
            );
          }

          // ── 1. Gemini API key from Cloudflare env ──────────────────
          const GEMINI_KEY = (process.env as Record<string, string>).GEMINI_API_KEY ?? "";

          // ── 2. Supabase se saare active tests fetch karo ──────────
          let allTests: Test[] = [];
          try {
            const res = await fetch(
              `${SUPA_BASE}/tests?select=id,name,stream,subject,total_questions,total_marks&status=eq.active&order=created_at.desc`,
              {
                headers: {
                  apikey: SUPA_KEY,
                  Authorization: `Bearer ${SUPA_KEY}`,
                },
              }
            );
            allTests = await res.json();
          } catch {
            // Supabase fail hone pe empty list
          }

          // ── 3. User ke message ke basis pe relevant tests dhundo ──
          const lower = message.toLowerCase();
          const words = lower
            .split(/\s+/)
            .filter((w) => w.length > 2);

          const relevant = allTests
            .filter((t) => {
              const haystack =
                `${t.name} ${t.stream} ${t.subject ?? ""}`.toLowerCase();
              return words.some((w) => haystack.includes(w));
            })
            .slice(0, 8);

          // Agar koi match nahi mila toh latest 5 tests dikhao
          const contextTests = relevant.length > 0 ? relevant : allTests.slice(0, 5);

          // ── 4. Gemini ke liye prompt banao ────────────────────────
          const systemPrompt = `Tu NiteshAI hai — AdhyayX exam platform ka friendly AI assistant. AdhyayX ek free Indian exam prep platform hai jisme JEE, NEET, NDA, SSC, UPSC, Boards aur Physics Wallah mock tests hain. Current Affairs aur Daily News bhi available hai.

Niche diye gaye tests abhi database mein available hain (user ke query se related):
${JSON.stringify(contextTests, null, 2)}

Rules:
- User jo bhaasha mein puchhe (Hindi/English/Hinglish) usi mein jawab de
- Friendly aur concise reh — 150 words se zyada nahi
- Agar tests match hain toh clearly list kar: naam, stream, questions, marks
- Sirf database ke tests batao — kuch banao mat
- Agar exact match nahi mila toh jo available hai wo suggest karo
- Har jawab ke ant mein ek helpful tip de`;

          const geminiBody = {
            contents: [
              {
                parts: [
                  { text: `${systemPrompt}\n\nUser ka sawaal: ${message}` },
                ],
              },
            ],
            generationConfig: {
              maxOutputTokens: 350,
              temperature: 0.7,
            },
          };

          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(geminiBody),
            }
          );

          const geminiData = (await geminiRes.json()) as {
            candidates?: { content: { parts: { text: string }[] } }[];
          };

          const reply =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ??
            "Mujhe abhi thodi problem aa rahi hai. Thodi der baad try karo! 🙏";

          return new Response(
            JSON.stringify({ reply, tests: contextTests }),
            { headers: { "content-type": "application/json" } }
          );
        } catch (err) {
          console.error("NiteshAI error:", err);
          return new Response(
            JSON.stringify({
              reply: "Kuch gadbad ho gayi! Please dobara try karo. 😅",
              tests: [],
            }),
            { status: 500, headers: { "content-type": "application/json" } }
          );
        }
      },
    },
  },
});

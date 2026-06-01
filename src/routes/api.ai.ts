import { createFileRoute } from "@tanstack/react-router";

const SUPA_BASE = "https://wzrzoogsjhxuvymkfoda.supabase.co/rest/v1";
const SUPA_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cnpvb2dzamh4dXZ5bWtmb2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNzY4NjYsImV4cCI6MjA5NTg1Mjg2Nn0.r2rGk10GU_yygfdaU4zfaFcK6mAe7WBCJ0c-QLpJLAs";

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
              JSON.stringify({
                reply: "Kuch puchho! JEE, NEET, NDA, ya kisi exam ke baare mein. Free tests available hain!",
                tests: []
              }),
              { headers: { "content-type": "application/json" } }
            );
          }

          let allTests: Test[] = [];
          try {
            const res = await fetch(
              `${SUPA_BASE}/tests?select=id,name,stream,subject,total_questions,total_marks&status=eq.active&order=created_at.desc&limit=50`,
              { headers: { apikey: SUPA_ANON, Authorization: `Bearer ${SUPA_ANON}` } }
            );
            allTests = await res.json();
          } catch (err) {
            console.error("Supabase fetch failed");
          }

          const lower = message.toLowerCase();
          const words = lower.split(/\s+/).filter((w) => w.length > 2);

          const relevant = allTests
            .filter((t) => {
              const haystack = `${t.name} ${t.stream} ${t.subject ?? ""}`.toLowerCase();
              return words.some((w) => haystack.includes(w));
            })
            .slice(0, 6);

          const contextTests = relevant.length > 0 ? relevant : allTests.slice(0, 5);

          const systemPrompt = `You are NiteshAI - a helpful exam prep assistant for AdhyayX.

AdhyayX Features:
- 350+ Test Categories (JEE, NEET, NDA, GATE, SSC, UPSC, Banking, Boards, etc.)
- Physics Wallah: 26 exams, 10 classes, batch tests
- Current Affairs: Daily updates
- Daily News: Exam-focused
- ALL COMPLETELY FREE

Available tests: ${JSON.stringify(contextTests.slice(0, 3), null, 2)}

RULES:
1. Answer in user's language (Hindi/English/Hinglish)
2. Keep response under 100 words
3. If tests match, list them clearly with details
4. Mention /categories, /pw, /current-affairs, /daily-news when relevant
5. Always emphasize AdhyayX is COMPLETELY FREE
6. Be friendly, conversational, and helpful`;

          const geminiKey = (process.env as Record<string, string>).GEMINI_API_KEY ?? "";

          if (!geminiKey) {
            return handleFallbackResponse(message, contextTests);
          }

          try {
            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [
                        { text: `${systemPrompt}\n\nUser: ${message}` }
                      ]
                    }
                  ],
                  generationConfig: {
                    maxOutputTokens: 200,
                    temperature: 0.7,
                  }
                })
              }
            );

            const geminiData = await geminiRes.json() as {
              candidates?: { content: { parts: { text: string }[] } }[];
            };

            const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ??
              "Samajh nahi aaya. Dobara puchho!";

            return new Response(
              JSON.stringify({ reply, tests: contextTests }),
              { headers: { "content-type": "application/json" } }
            );
          } catch (err) {
            return handleFallbackResponse(message, contextTests);
          }
        } catch (err) {
          console.error("AI error:", err);
          return new Response(
            JSON.stringify({
              reply: "Technical issue. /categories, /pw, /current-affairs visit karo!",
              tests: [],
            }),
            { status: 500, headers: { "content-type": "application/json" } }
          );
        }
      },
    },
  },
});

function handleFallbackResponse(message: string, tests: Test[]) {
  const lower = message.toLowerCase();

  if (lower.includes("free") || lower.includes("cost") || lower.includes("price")) {
    return new Response(
      JSON.stringify({
        reply: "AdhyayX bilkul FREE hai! 0 rupees. Sab kuch - tests, PW mocks, current affairs, news - sab FREE!",
        tests
      }),
      { headers: { "content-type": "application/json" } }
    );
  }

  if (lower.includes("nda") || lower.includes("defence") || lower.includes("army")) {
    return new Response(
      JSON.stringify({
        reply: "NDA tests available! Math, GAT, English mocks. /categories ya /pw visit karo - sab FREE!",
        tests
      }),
      { headers: { "content-type": "application/json" } }
    );
  }

  if (lower.includes("current") || lower.includes("affairs") || lower.includes("news")) {
    return new Response(
      JSON.stringify({
        reply: "Current affairs aur daily news /current-affairs aur /daily-news par milega! Daily updates, sab FREE!",
        tests: []
      }),
      { headers: { "content-type": "application/json" } }
    );
  }

  if (lower.includes("pw") || lower.includes("physics wallah")) {
    return new Response(
      JSON.stringify({
        reply: "Physics Wallah tests /pw par! 26 exams, 10 classes - sab FREE mocks!",
        tests
      }),
      { headers: { "content-type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      reply: "Tests, exams, current affairs - sab /categories, /pw, /current-affairs, /daily-news par milega! FREE!",
      tests
    }),
    { headers: { "content-type": "application/json" } }
  );
}

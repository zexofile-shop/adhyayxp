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

interface PwBatch {
  _id: string;
  testCatId: string;
  name: string;
}

const PW_EXAMS = [
  "IIT-JEE", "NEET", "BOARD_EXAM", "AE/JE", "Banking",
  "BPSC", "CA", "COMMERCE", "CSIR NET", "CUET UG",
  "FOUNDATION", "GATE", "IIT JAM", "LAW", "MBA",
  "NDA", "NSAT", "OLYMPIAD", "PRE_FOUNDATION", "Railway",
  "SCHOOL_PREPARATION", "SSC", "UGC NET", "UP Exams",
  "UPPSC", "UPSC"
];

const PW_CLASSES = ["6", "7", "8", "9", "10", "11", "12", "12+", "Graduation", "Under Graduation"];

const SITE_CONTEXT = `
AdhyayX - Free Indian Exam Prep Platform
==========================================

FEATURES:
1. MOCK TESTS - JEE, NEET, NDA, GATE, SSC, UPSC, Banking, CUET, Board exams (Class 6-12)
2. PHYSICS WALLAH (PW) - 26 exams, 10 classes, batch tests
3. CURRENT AFFAIRS - Daily updates for competitive exams
4. DAILY NEWS - Latest news for exam preparation

TEST CATEGORIES:
- JEE (IIT-JEE): Physics, Chemistry, Math for Class 11, 12, Droppers
- NEET: Biology, Physics, Chemistry for medical aspirants
- NDA: National Defence Academy - Math, GAT, English
- GATE: Graduate Aptitude Test in Engineering
- SSC: Staff Selection Commission exams
- UPSC: Civil Services, NDA/CDS
- Banking: IBPS, SBI, RBI exams
- Board Exams: Class 6, 7, 8, 9, 10, 11, 12 (CBSE, State Boards)

PW EXAMS AVAILABLE (26 total):
${PW_EXAMS.join(", ")}

PW CLASSES AVAILABLE (10 total):
${PW_CLASSES.join(", ")}

SITE IS COMPLETELY FREE - No payments, no subscriptions!

NAVIGATION:
- /categories - All test categories
- /pw - Physics Wallah batch tests
- /current-affairs - Daily current affairs
- /daily-news - Latest news
- /test/[id] - Take a specific test
- /ai - This AI assistant (NiteshAI)
`;

const SYNONYMS: Record<string, string[]> = {
  "nda": ["national defence", "defence academy", "army", "navy", "air force", "military"],
  "jee": ["iit", "iit-jee", "jee mains", "jee advanced", "engineering entrance"],
  "neet": ["medical", "mbbs", "medical entrance", "doctor"],
  "upsc": ["civil services", "ias", "ips", "ips exam", "civil service"],
  "ssc": ["staff selection", "ssc cgl", "ssc chsl", "govt job"],
  "gate": ["engineering postgrad", "mtech", "engineering masters"],
  "banking": ["bank", "ibps", "sbi", "bank po", "bank clerk", "banking exam"],
  "boards": ["board exam", "cbse", "state board", "class 10", "class 12"],
  "current affairs": ["affairs", "current news", "daily news", "latest news", "today news"],
  "test": ["mock test", "practice test", "exam", "question paper", "paper"],
  "free": ["no cost", "without payment", "zero cost", "free of cost"],
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function expandQuery(query: string): string[] {
  const words = normalize(query).split(" ");
  const expanded = new Set<string>(words);

  for (const word of words) {
    for (const [key, synonyms] of Object.entries(SYNONYMS)) {
      if (word.includes(key) || synonyms.some(s => word.includes(s) || s.includes(word))) {
        expanded.add(key);
        synonyms.forEach(s => expanded.add(s));
      }
    }
  }

  return Array.from(expanded);
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
                reply: "Kuch puchho! Main yahan hoon. Kya aap JEE, NEET, NDA, ya kisi aur exam ke baare mein jaanna chahte ho?",
                tests: []
              }),
              { headers: { "content-type": "application/json" } }
            );
          }

          let allTests: Test[] = [];
          try {
            const res = await fetch(
              `${SUPA_BASE}/tests?select=id,name,stream,subject,total_questions,total_marks&status=eq.active&order=created_at.desc`,
              { headers: { apikey: SUPA_ANON, Authorization: `Bearer ${SUPA_ANON}` } }
            );
            allTests = await res.json();
          } catch {
            console.error("Failed to fetch tests from Supabase");
          }

          let pwBatches: PwBatch[] = [];
          try {
            const pwRes = await fetch(
              `https://v1.sstudy.site/api/batches?exam=IIT-JEE&class=11`,
              { headers: { referer: "https://www.sstudy.site/" } }
            );
            const pwData = await pwRes.json();
            pwBatches = pwData.data?.slice(0, 5) || [];
          } catch {
            console.error("Failed to fetch PW batches");
          }

          const expandedTerms = expandQuery(message);
          const lower = message.toLowerCase();

          const relevant = allTests.filter((t) => {
            const haystack = `${t.name} ${t.stream} ${t.subject ?? ""}`.toLowerCase();
            return expandedTerms.some((term) => haystack.includes(term));
          }).slice(0, 8);

          const contextTests = relevant.length > 0 ? relevant : allTests.slice(0, 5);

          let answerType = "general";

          if (lower.includes("free") || lower.includes("cost") || lower.includes("payment") || lower.includes("price")) {
            answerType = "pricing";
          } else if (lower.includes("current affair") || lower.includes("news") || lower.includes("aaj ki")) {
            answerType = "affairs";
          } else if (lower.includes("pw") || lower.includes("physics wallah") || lower.includes("wallah")) {
            answerType = "pw";
          } else if (relevant.length > 0 && (lower.includes("test") || lower.includes("exam") || lower.includes("mock") || lower.includes("practice"))) {
            answerType = "tests";
          }

          const systemPrompt = `Tu NiteshAI hai - AdhyayX ka helpful AI assistant. Ye ek FREE Indian exam prep platform hai.

${SITE_CONTEXT}

USER DATABASE MEIN AVAILABLE TESTS (user ke query se related):
${JSON.stringify(contextTests, null, 2)}

USER KE SAWAAL KA TYPE: ${answerType}

IMPORTANT RULES:
1. User ki bhasha mein reply karo (Hindi/English/Hinglish)
2. Friendly aur concise - 100 words se zyada mat likho
3. Agar tests match hue to clear list karo with details
4. Sirf database ke tests batao - fake mat banao
5. Agar exact nahi mila to similar suggest karo
6. Always end with a helpful tip ya next step
7. "Free" ke baare mein puchhe to ZAROOR bolo ki site completely FREE hai
8. Current affairs ya news ke liye /current-affairs aur /daily-news redirect karo
9. PW tests ke liye /pw redirect karo
10. Kisi specific test ka naam ho to uska ID include karo for direct navigation`;

          const aiResponse = await fetchAIResponse(message, systemPrompt);

          return new Response(
            JSON.stringify({
              reply: aiResponse,
              tests: answerType === "tests" || answerType === "pw" ? contextTests : []
            }),
            { headers: { "content-type": "application/json" } }
          );
        } catch (err) {
          console.error("NiteshAI error:", err);
          return new Response(
            JSON.stringify({
              reply: "Kuch technical issue aa gayi. Thodi der baad try karo! Ya directly /categories ya /pw visit karo.",
              tests: [],
            }),
            { status: 500, headers: { "content-type": "application/json" } }
          );
        }
      },
    },
  },
});

async function fetchAIResponse(userMessage: string, systemPrompt: string): Promise<string> {
  const CF_API_TOKEN = (process.env as Record<string, string>).CF_API_TOKEN ?? "";
  const CF_ACCOUNT_ID = (process.env as Record<string, string>).CF_ACCOUNT_ID ?? "";

  const lower = userMessage.toLowerCase();

  if (lower.includes("free") || lower.includes("cost") || lower.includes("payment") || lower.includes("price") || lower.includes("charges")) {
    return `AdhyayX BILKUL FREE hai! No payment, no subscription, no hidden charges.

Sab kuch free:
- ${PW_EXAMS.length}+ exam categories (JEE, NEET, NDA, GATE, SSC, UPSC...)
- Physics Wallah batch tests (26 exams, 10 classes)
- Current Affairs - Daily updates
- Daily News - Exam-focused

Koi paisa nahi lagta!`;
  }

  if (lower.includes("current affair") || lower.includes("affairs") || lower.includes("aaj ki taza") || lower.includes("daily news")) {
    return "Current Affairs aur Daily News ke liye /current-affairs aur /daily-news visit karo! Daily updates milte hain competitive exams ke liye - UPSC, SSC, Banking,State PSC sabke liye.";
  }

  if (lower.includes("pw") || lower.includes("physics wallah") || lower.includes("wallah") || lower.includes("pw test")) {
    return "Physics Wallah batch tests ke liye /pw visit karo! Wahan 26 exams (IIT-JEE, NEET, UPSC, GATE, NDA...) aur 10 classes (6-12, Dropper, Graduation) ke mock tests hain - sab completely FREE!";
  }

  if (lower.includes("nd") || lower.includes("nda") || lower.includes("defence") || lower.includes("army") || lower.includes("navy")) {
    return "NDA (National Defence Academy) tests available hain! Math, GAT, English ke mock tests hain. /categories visit karo aur NDA category select karo. Physics Wallah mein bhi NDA tests hain - /pw check karo!";
  }

  if (lower.includes("jee") || lower.includes("iit") || lower.includes("engineering")) {
    return "JEE/IIT-JEE ke liye tests available hain! Physics, Chemistry, Math - sab subjects. /categories visit karo. PW batch tests bhi hain - /pw jao!";
  }

  if (lower.includes("neet") || lower.includes("medical") || lower.includes("mbbs") || lower.includes("doctor")) {
    return "NEET ke liye complete mock tests available! Biology, Physics, Chemistry sab covered. /categories dekho. PW bhi NEET tests hai - /pw visit karo!";
  }

  if (!CF_API_TOKEN || !CF_ACCOUNT_ID) {
    if (lower.includes("test") || lower.includes("exam") || lower.includes("mock") || lower.includes("practice")) {
      return "Tests ke liye /categories visit karo! JEE, NEET, NDA, GATE, SSC, UPSC, Banking, Board exams - sab ke sab tests available hain. Physics Wallah tests ke liye /pw jao!";
    }

    if (lower.includes("kya") || lower.includes("what") || lower.includes("about")) {
      return "AdhyayX ek FREE exam prep platform hai. Yahan mock tests, PW batch tests, current affairs, daily news - sab milta hai. Koi payment nahi! /categories, /pw, /current-affairs, /daily-news visit karo!";
    }

    return "Main NiteshAI hoon! Aap mujh se exams, tests, current affairs, pricing ya site ke baare mein kuch bhi puchh sakte ho. Direct pages: /categories, /pw, /current-affairs, /daily-news";
  }

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-2-7b-chat-int8`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          max_tokens: 250,
          temperature: 0.7,
        }),
      }
    );

    const data = await res.json() as { result?: { response?: string } };
    return data?.result?.response ?? "Kuch samajh nahi aaya. Dobara puchho!";
  } catch {
    return "Technical issue. Pages visit karo: /categories, /pw, /current-affairs, /daily-news";
  }
}

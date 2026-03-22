import { GoogleGenerativeAI, type Content } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

function getClient() {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY not configured");
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

export async function generateAnalysis(portfolio: {
  totalValue: number;
  allocation: { sector: number; strategy: number; safety: number };
  holdings: string[];
}): Promise<{ critic: string; optimist: string; realist: string }> {
  const model = getClient().getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = `You are a world-class financial advisor AI analyzing a young investor's simulated portfolio on QuantQuest, a gamified investing education platform.

Portfolio details:
- Total value: $${portfolio.totalValue.toFixed(2)}
- Sector allocation: $${portfolio.allocation.sector.toFixed(2)}
- Strategy allocation: $${portfolio.allocation.strategy.toFixed(2)}
- Safety allocation: $${portfolio.allocation.safety.toFixed(2)}
- Holdings: ${portfolio.holdings.join(", ") || "No active positions yet"}

Write three rich, detailed analysis perspectives. Each perspective must:
- Open with a **bold one-sentence verdict** (e.g. **This portfolio carries significant concentration risk.**)
- Follow with 4-6 bullet points using "- " prefix, each referencing specific holdings by name
- Use **bold** for key terms, numbers, and important concepts
- Use *italics* for caveats, nuance, and predictions
- Close with a single *italicized takeaway sentence*
- Be genuinely insightful and educational — explain the "why", not just the "what"

Return JSON with exactly these keys. The values must be markdown strings using \\n for newlines:
{
  "critic": "The Critic perspective — focus on every risk: overexposure, concentration, missing diversification, macro vulnerabilities, what could blow up and why. Be specific and frank.",
  "optimist": "The Optimist perspective — focus on every upside: strong positions, favorable sector tailwinds, compounding potential, best-case catalysts. Be enthusiastic but grounded.",
  "realist": "The Realist perspective — the balanced, most-probable view: expected return range, realistic volatility, what's likely to happen, what to watch, and one actionable suggestion."
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return JSON.parse(text);
}

export async function generateInvestmentDescription(
  name: string,
  type: "sector" | "strategy" | "safety",
  existingDescription: string
): Promise<string> {
  const model = getClient().getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a financial education AI. Write a compelling, beginner-friendly 2-sentence description for this investment product on a gamified investing platform:

Name: ${name}
Type: ${type}
Current description: ${existingDescription}

Make it engaging for young investors (18-25). Be specific about what makes this investment interesting. Return ONLY the description text, no quotes or formatting.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export async function explainInvestment(
  name: string,
  type: "sector" | "strategy" | "safety",
  description: string
): Promise<string> {
  const model = getClient().getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Explain "${name}" (a ${type} investment) to someone who knows absolutely nothing about investing or finance.

Here's the technical description: ${description}

Rules:
- Use 3-4 short, simple sentences
- Use everyday analogies (like grocery shopping, sports, or everyday life)
- No financial jargon at all — if you must use a term, explain it in parentheses
- Make it feel friendly and conversational
- Start with what it IS in the simplest terms, then why someone might want it
- Return ONLY the explanation text, no quotes or formatting`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export async function chatWithPerspective(
  perspective: "critic" | "optimist" | "realist",
  analysisText: string,
  holdings: string[],
  history: { role: "user" | "model"; text: string }[],
  userMessage: string
): Promise<string> {
  const model = getClient().getGenerativeModel({ model: "gemini-2.5-flash" });

  const personaMap = {
    critic: "The Critic — you focus on risks, downsides, and what could go wrong. You're frank, direct, and a bit skeptical. You want to protect this investor from mistakes.",
    optimist: "The Optimist — you focus on upside potential, tailwinds, and what could go right. You're enthusiastic but grounded. You want to encourage this investor while keeping it real.",
    realist: "The Realist — you give the balanced, most-probable view. You weigh both sides objectively. You give practical, actionable advice.",
  };

  const systemPrompt = `You are a financial advisor AI on QuantQuest, a gamified investing education platform for young investors (18-25).

Your persona: ${personaMap[perspective]}

You already wrote this analysis of the user's portfolio:
---
${analysisText}
---

The user's current holdings: ${holdings.join(", ") || "No positions"}

Rules:
- Stay in character as ${perspective === "critic" ? "The Critic" : perspective === "optimist" ? "The Optimist" : "The Realist"}
- Keep responses concise (2-4 sentences unless they ask for detail)
- Be educational — explain financial concepts simply when they come up
- Reference their specific holdings when relevant
- Use **bold** for key terms and *italics* for nuance
- Never give actual financial advice — this is a simulation for learning
- Be conversational and engaging, not stiff`;

  const chatHistory: Content[] = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: `Got it — I'm ${perspective === "critic" ? "The Critic" : perspective === "optimist" ? "The Optimist" : "The Realist"}. Let's discuss your portfolio.` }] },
    ...history.map((h) => ({
      role: h.role as "user" | "model",
      parts: [{ text: h.text }],
    })),
  ];

  const chat = model.startChat({ history: chatHistory });
  const result = await chat.sendMessage(userMessage);
  return result.response.text().trim();
}

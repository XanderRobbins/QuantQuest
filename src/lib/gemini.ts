import { GoogleGenerativeAI } from "@google/generative-ai";

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
  const model = getClient().getGenerativeModel({ model: "gemini-2.5-flash" });

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

Return ONLY valid JSON (no markdown code fences) with exactly these keys. The values must be markdown strings:
{
  "critic": "The Critic perspective — focus on every risk: overexposure, concentration, missing diversification, macro vulnerabilities, what could blow up and why. Be specific and frank.",
  "optimist": "The Optimist perspective — focus on every upside: strong positions, favorable sector tailwinds, compounding potential, best-case catalysts. Be enthusiastic but grounded.",
  "realist": "The Realist perspective — the balanced, most-probable view: expected return range, realistic volatility, what's likely to happen, what to watch, and one actionable suggestion."
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse Gemini response");

  return JSON.parse(jsonMatch[0]);
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

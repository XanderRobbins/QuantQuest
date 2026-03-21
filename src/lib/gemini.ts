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
  const model = getClient().getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are a world-class financial advisor AI analyzing a young investor's simulated portfolio on an educational investing platform called QuantQuest.

Portfolio details:
- Total value: $${portfolio.totalValue.toFixed(2)}
- Sector allocation: $${portfolio.allocation.sector.toFixed(2)}
- Strategy allocation: $${portfolio.allocation.strategy.toFixed(2)}
- Safety allocation: $${portfolio.allocation.safety.toFixed(2)}
- Holdings: ${portfolio.holdings.join(", ") || "No active positions yet"}

Provide three analysis perspectives. Each should be 3-4 sentences, insightful, specific to their holdings, and educational. Reference actual positions by name.

Return ONLY valid JSON (no markdown fences) with these exact keys:
{
  "critic": "Focus on risks, overexposure, concentration, missing diversification, what could go wrong",
  "optimist": "Focus on upside potential, strong positions, favorable catalysts, best-case scenarios",
  "realist": "Balanced view, expected returns, realistic risks and rewards, most probable outcomes"
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
  const model = getClient().getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are a financial education AI. Write a compelling, beginner-friendly 2-sentence description for this investment product on a gamified investing platform:

Name: ${name}
Type: ${type}
Current description: ${existingDescription}

Make it engaging for young investors (18-25). Be specific about what makes this investment interesting. Return ONLY the description text, no quotes or formatting.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

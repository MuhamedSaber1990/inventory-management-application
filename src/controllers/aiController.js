import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

// Configure AI Client
const openai = new OpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function generateProductDescription(req, res) {
  const { productName, category } = req.body;

  if (!productName) {
    return res.status(400).json({ error: "Product name is required" });
  }

  try {
    const prompt = `
      Write a strictly factual and short description (maximum 20 words) for a product named "${productName}" in the category "${category}".
      
      Rules:
      1. Do NOT invent specific specs (like numbers, versions, or battery life) unless they are in the name.
      2. Do NOT use quotation marks.
      3. Keep it simple and direct.
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      max_tokens: 50,
      temperature: 0.3,
    });

    const description = completion.choices[0].message.content.trim();

    //CLEANUP (Remove accidental quotes)
    description.replace(/^"|"$/g, "").replace(/^'|'$/g, "");

    return res.json({ success: true, description });
  } catch (error) {
    console.error("AI Generation Error:", error);
    return res.status(500).json({ error: "Failed to generate description" });
  }
}

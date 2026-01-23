import OpenAI from "openai";
import dotenv from "dotenv";
import { getCategories } from "../models/productModel.js";

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

export async function naturalLanguageSearch(req, res) {
  const { query } = req.body;

  if (!query) return res.status(400).json({ error: "Query required" });

  try {
    // 1. Get current categories to help AI match them
    const categories = await getCategories();
    const catList = categories.map((c) => `${c.name} (ID: ${c.id})`).join(", ");

    // 2. The Prompt
    const prompt = `
      You are a search assistant for an inventory system.
      Translate the user's natural language query into a JSON object of filter parameters.
      
      Available Filter Keys: 
      - search (string): for product names/SKUs
      - category (string): MUST be the exact Category Name from the list below
      - minPrice (number)
      - maxPrice (number)
      - stockStatus (string): 'in', 'low', 'out'
      - sortBy (string): 'price', 'quantity', 'created_at', 'name'
      - sortOrder (string): 'ASC', 'DESC'

      Available Categories: [${catList}]

      User Query: "${query}"

      Rules:
      1. Interpret "cheap" as sort price ASC.
      2. Interpret "expensive" as sort price DESC.
      3. Interpret "newest" as sort created_at DESC.
      4. Interpret "low stock" as stockStatus: 'low'.
      5. Only return the JSON object. No other text.
    `;

    // 3. Call AI
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile", // Smart model required for logic
      temperature: 0, // Strict logic
      response_format: { type: "json_object" }, // Force JSON return
    });

    const filters = JSON.parse(completion.choices[0].message.content);

    return res.json({ success: true, filters });
  } catch (error) {
    console.error("AI Search Error:", error);
    return res.status(500).json({ error: "AI failed" });
  }
}

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

export async function generateDashboardInsights(req, res) {
  const { stats, categoryData, trendData } = req.body;

  try {
    // 1. Construct a summary prompt
    const prompt = `
      You are an inventory manager assistant. Analyze this data:
      - Total Products: ${stats.total_items}
      - Total Value: €${stats.total_value}
      - Low Stock Items: ${stats.low_stock_count}
      - Top Categories: ${JSON.stringify(categoryData.slice(0, 3))}
      - Recent Growth Trend: ${JSON.stringify(trendData)}

      Write a short, professional "Executive Summary" (maximum 3 bullet points).
      Focus on financial health, stock risks, and growth. 
      Format the output as HTML <li> elements. Do not include <ul> tags.
      Use emojis for each bullet point.
    `;

    // 2. Call AI
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
    });

    const insights = completion.choices[0].message.content.trim();

    return res.json({ success: true, insights });
  } catch (error) {
    console.error("AI Insights Error:", error);
    return res.status(500).json({ error: "Failed to generate insights" });
  }
}

export async function suggestCategory(req, res) {
  const { productName } = req.body;

  if (!productName) {
    return res.status(400).json({ error: "Product name is required" });
  }

  try {
    // 1. Get existing categories from DB
    const categories = await getCategories();

    // Format list for AI: "1: Electronics, 2: Furniture..."
    const catList = categories.map((c) => `${c.id}: ${c.name}`).join("\n");

    const prompt = `
      I have a product named "${productName}".
      Which of the following categories does it belong to?
      
      Categories List:
      ${catList}
      
      Rules:
      1. Return ONLY the ID of the best matching category.
      2. Return JSON format: { "id": number }
      3. If no category fits well, pick the closest one or "General/Uncategorized" if available.
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile", // Smart model needed for classification
      temperature: 0, // Strict logic, no creativity
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);

    return res.json({ success: true, categoryId: result.id });
  } catch (error) {
    console.error("AI Category Suggestion Error:", error);
    return res.status(500).json({ error: "Failed to suggest category" });
  }
}

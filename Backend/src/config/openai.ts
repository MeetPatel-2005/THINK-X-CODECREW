import dotenv from "dotenv";
dotenv.config(); // ✅ MUST be first

import OpenAI from "openai";

// Optional safety check (recommended)
if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is missing in .env file");
}

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "University RAG Chatbot",
  },
});

export default openai;

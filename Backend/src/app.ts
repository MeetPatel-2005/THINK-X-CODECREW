import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

import openai from "./config/openai.ts";
import fileRouter from "./file/FileRoutes.js";
import { config } from "./config/config.ts";
import userRouter from "./user/UserRoutes.ts";

dotenv.config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: config.frontendDomain,
  }),
);

// Serve static files from public directory
app.use("/public", express.static(path.join(process.cwd(), "public")));

app.use("/api/users", userRouter);

// File upload routes
app.use("/api/files", fileRouter);

/**
 * Build MongoDB Vector Search aggregation pipeline
 */
function buildAggregationPipeline(queryEmbedding: number[]) {
  return [
    {
      $vectorSearch: {
        index: "university_rag_vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: 100,
        limit: 5,
      },
    },
    {
      $project: {
        content: 1,
        domain: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ];
}

/**
 * Convert user query → embedding
 */
async function getQueryEmbedding(query: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
    dimensions: 512,
  });

  return response.data[0].embedding;
}

/**
 * Check if question is basic human interaction
 */
function isBasicHumanInteraction(query: string): string | null {
  const queryLower = query.toLowerCase().trim();

  // Greetings
  if (
    /^(hi|hello|hey|good morning|good afternoon|good evening|greetings)$/i.test(
      queryLower,
    )
  ) {
    return "Hello, I'm your university assistant. How can I help you?";
  }

  // How are you
  if (/how are you|how're you|how do you do/i.test(queryLower)) {
    return "I'm here and ready to assist you with any university-related queries.";
  }

  // Date and time
  if (/what.*date.*today|today.*date|current date/i.test(queryLower)) {
    return `Today's date is ${new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.`;
  }

  if (/what.*time|current time|time now/i.test(queryLower)) {
    return `The current time is ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}.`;
  }

  // Help and assistance
  if (
    /^(can you help|help me|can you assist|what can you do)$/i.test(queryLower)
  ) {
    return "I can assist with academics, fees, placements, hostel, scholarships, courses, and other university-related topics.";
  }

  // Thank you
  if (/^(thank|thanks|thank you|thx)$/i.test(queryLower)) {
    return "You're welcome. Feel free to ask anything else.";
  }

  // Goodbye
  if (/^(bye|goodbye|see you|take care)$/i.test(queryLower)) {
    return "Goodbye. Reach out anytime you need assistance.";
  }

  return null;
}

/**
 * Check if question is university-related
 */
async function isUniversityRelated(query: string): Promise<boolean> {
  const universityKeywords = [
    "fee",
    "fees",
    "tuition",
    "semester",
    "academic",
    "academics",
    "grades",
    "course",
    "courses",
    "subject",
    "subjects",
    "hostel",
    "hostels",
    "placement",
    "placements",
    "scholarship",
    "scholarships",
    "cgpa",
    "attendance",
    "admission",
    "admissions",
    "exam",
    "exams",
    "faculty",
    "professor",
    "professors",
    "department",
    "departments",
    "student",
    "students",
    "university",
    "college",
    "campus",
    "library",
    "libraries",
    "mess",
    "cafeteria",
    "transport",
    "transportation",
    "timetable",
    "schedule",
    "result",
    "results",
    "marks",
    "marking",
    "degree",
    "degrees",
    "program",
    "programs",
    "curriculum",
    "lab",
    "labs",
    "laboratory",
    "practical",
    "assignment",
    "assignments",
    "project",
    "projects",
    "facilities",
    "facility",
    "amenities",
    "amenity",
    "dorm",
    "dormitory",
    "room",
    "rooms",
    "accommodation",
    "canteen",
    "dining",
    "wifi",
    "internet",
    "registration",
    "enroll",
    "enrollment",
    "class",
    "classes",
    "lecture",
    "lectures",
    "tutorial",
    "workshop",
    "seminar",
    "graduation",
    "convocation",
    "transcript",
    "certificate",
    "notification",
    "notice",
    "announcement",
    "event",
    "activity",
    "club",
    "societies",
    "sports",
    "gym",
    "medical",
    "counseling",
    "support",
    "help",
    "assistance",
    "guidance",
  ];

  const queryLower = query.toLowerCase();
  return universityKeywords.some((keyword) => queryLower.includes(keyword));
}

/**
 * Check if query needs structured response with formatting
 */
function needsStructuredResponse(query: string): boolean {
  const queryLower = query.toLowerCase();

  // Queries that benefit from structured formatting
  const structuredKeywords = [
    "fee structure",
    "fees breakdown",
    "fee details",
    "cost breakdown",
    "schedule",
    "timetable",
    "time table",
    "class schedule",
    "facilities",
    "amenities",
    "services offered",
    "course list",
    "subjects list",
    "program details",
    "placement process",
    "placement procedure",
    "placement steps",
    "hostel facilities",
    "hostel amenities",
    "hostel services",
    "scholarship types",
    "scholarship details",
    "available scholarships",
    "admission requirements",
    "admission process",
    "admission criteria",
    "departments",
    "faculty details",
    "staff details",
  ];

  return structuredKeywords.some((keyword) => queryLower.includes(keyword));
}

/**
 * Generate final answer using retrieved context with enhanced AI reasoning
 */
async function getAnswerFromLLM(query: string, context: string) {
  const useStructuredFormat = needsStructuredResponse(query);

  const systemPrompt = useStructuredFormat
    ? `You are a professional university assistant. Keep responses concise and well-formatted.

MANDATORY RULES:
1. NEVER use emojis. Keep tone professional.
2. NEVER list each student/record separately. ALWAYS aggregate and summarize.
3. When data has multiple entries, show RANGES (min - max).
4. Maximum 6-8 lines total.
5. Use ₹ for currency.
6. Put headings on their own line, content BELOW the heading — never beside it.
7. Use **bold** for headings and key totals only.

FORMAT:
**Heading**
- Item: value
- Item: value
- **Total: value**

CORRECT EXAMPLE:
**Fee Structure (Sem 7-8)**
- Tuition: ₹59,000 - ₹60,000
- Hostel: ₹20,000 - ₹22,000
- Mess: ₹14,000 - ₹15,000
- Transport: ₹0 - ₹6,000
- **Total: ₹94,000 - ₹1,00,500**

WRONG: Listing Student 1, Student 2, Student 3 separately. NEVER DO THIS.
WRONG: Using emojis like 📋 🎓 ✅ anywhere. NEVER DO THIS.`
    : `You are a professional university assistant.

RULES:
- Maximum 2-3 lines. Be concise and professional.
- NEVER use emojis.
- When multiple records exist, give ranges or summaries, NOT individual listings.
- Use ₹ for currency.
- Answer even if context is limited.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Context: ${context}

Question: ${query}

Provide a helpful answer:`,
      },
    ],
    temperature: 0.1,
    max_tokens: useStructuredFormat ? 150 : 100,
  });

  return completion.choices[0].message.content;
}

/**
 * Health check
 */
app.get("/", (_req, res) => {
  res.json({ message: "University RAG API is running" });
});

/**
 * RAG Chat Endpoint
 */
app.post("/api/chat", async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  try {
    // 1. Check if question is basic human interaction first
    const basicResponse = isBasicHumanInteraction(question);
    if (basicResponse) {
      return res.json({ answer: basicResponse });
    }

    // 2. Check if question is university-related
    const isUniversityQuestion = await isUniversityRelated(question);

    if (!isUniversityQuestion) {
      return res.json({
        answer:
          "I can only help with university-related questions like academics, fees, placements, hostel, scholarships, etc.",
      });
    }

    // 3. Generate query embedding
    const queryEmbedding = await getQueryEmbedding(question);

    // 4. Vector search in MongoDB
    const collection = mongoose.connection.db!.collection(
      "knowledge_embeddings",
    );

    const pipeline = buildAggregationPipeline(queryEmbedding);
    const results = await collection.aggregate(pipeline).toArray();

    // Use relevant results with lower threshold
    const relevantResults = results.filter((r) => r.score > 0.3);

    let context = "";
    if (relevantResults.length > 0) {
      context = relevantResults.map((r) => r.content).join("\n\n");
    }

    // Always try to answer university questions, even with limited context
    const answer = await getAnswerFromLLM(question, context);

    res.json({
      answer,
    });
  } catch (error) {
    console.error("RAG error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

import openai from "./config/openai.ts";
import fileRouter from "./file/FileRoutes.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// Serve static files from public directory
app.use("/public", express.static(path.join(process.cwd(), "public")));

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
 * Generate final answer using retrieved context with enhanced AI reasoning
 */
async function getAnswerFromLLM(query: string, context: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a helpful university assistant. You answer questions about all university-related topics.

GUIDELINES:
- Answer university questions even if the context is limited
- Use the provided context when available, but also use general university knowledge when needed
- If context is empty but question is university-related, provide helpful general information
- Give direct, concise answers in 2-3 lines maximum
- Be helpful and informative about university topics
- Don't mention sources or limitations

UNIVERSITY TOPICS INCLUDE:
- Academics, fees, courses, schedules, grades, attendance
- Hostel facilities, mess, accommodation, campus amenities  
- Scholarships, placements, admissions, registration
- Faculty, departments, programs, activities
- Student services, support, guidance`,
      },
      {
        role: "user",
        content: `Context: ${context}

Question: ${query}

Give a helpful answer about this university topic:`,
      },
    ],
    temperature: 0.3,
    max_tokens: 150,
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
    // 1. Check if question is university-related first
    const isUniversityQuestion = await isUniversityRelated(question);

    if (!isUniversityQuestion) {
      return res.json({
        answer:
          "I can only help with university-related questions like academics, fees, placements, hostel, scholarships, etc.",
      });
    }

    // 2. Generate query embedding
    const queryEmbedding = await getQueryEmbedding(question);

    // 3. Vector search in MongoDB
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

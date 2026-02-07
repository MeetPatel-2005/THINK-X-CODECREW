import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "../../config/db.ts";
import openai from "../../config/openai.js";
import { flattenRecord, toNaturalText } from "../../utils/flatten.ts";

dotenv.config();

/**
 * Directory containing all seed JSON files
 */
const SEED_DIR = path.resolve("src/seed");

/**
 * Create embeddings and store them in MongoDB Atlas
 */
async function createEmbeddings() {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Get collection (auto-created on insert)
    const collection = mongoose.connection.db!.collection(
      "knowledge_embeddings",
    );

    // 3. Read all JSON seed files
    const files = fs
      .readdirSync(SEED_DIR)
      .filter((file) => file.endsWith(".json"));

    if (files.length === 0) {
      console.log("No seed files found.");
      process.exit(0);
    }

    const documents: any[] = [];

    for (const file of files) {
      const filePath = path.join(SEED_DIR, file);
      const records = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      const domain = file.replace(".json", "");

      for (const record of records) {
        const text = toNaturalText(record, domain);

        if (!text || text.trim().length === 0) continue;

        // 4. Generate embedding (512 dims – matches Atlas vector index)
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: text,
          dimensions: 512,
        });

        documents.push({
          content: text.trim(),
          embedding: response.data[0].embedding,
          domain,
          sourceFile: file,
          createdAt: new Date(),
        });
      }

      console.log(`Processed embeddings for ${file}`);
    }

    // 5. Insert into MongoDB
    if (documents.length > 0) {
      await collection.insertMany(documents);
      console.log(`Inserted ${documents.length} embedding documents`);
    } else {
      console.log("No embeddings to insert.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Embedding process failed:", error);
    process.exit(1);
  }
}

createEmbeddings();

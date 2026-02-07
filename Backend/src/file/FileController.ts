import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import openai from "../config/openai.js";

/* =====================================================
   pdfjs-dist (ESM SAFE)
===================================================== */

/* =====================================================
   TYPES
===================================================== */
interface AuthRequest extends Request {
  userId?: string;
}

/* =====================================================
   PDF TEXT EXTRACTION USING pdfjs-dist
===================================================== */
async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    // Try different import paths for pdfjs-dist
    let pdfjsLib;
    try {
      pdfjsLib = await import('pdfjs-dist');
    } catch (error) {
      // Fallback to legacy path if main import fails
      pdfjsLib = await import('pdfjs-dist/build/pdf.js');
    }
    
    // Disable worker and font loading for Node.js environment
    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    }
    
    const data = new Uint8Array(fs.readFileSync(filePath));
    console.log(`📄 PDF file size: ${data.length} bytes`);
    
    const pdf = await pdfjsLib.getDocument({
      data,
      useSystemFonts: false,
      disableFontFace: true,
      nativeImageDecoderSupport: 'none',
      isEvalSupported: false,
      isOffscreenCanvasSupported: false,
    }).promise;

    console.log(`📋 PDF has ${pdf.numPages} pages`);
    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent({
        disableCombineTextItems: false,
        includeMarkedContent: false,
      });
      const pageText = content.items
        .filter((item: any) => 'str' in item)
        .map((item: any) => item.str)
        .join(" ");

      console.log(`📄 Page ${pageNum} extracted ${pageText.length} characters`);
      fullText += pageText + "\n";
    }

    const finalText = fullText.trim();
    console.log(`✅ Total extracted text: ${finalText.length} characters`);
    
    if (finalText.length === 0) {
      console.error(`❌ No text extracted - PDF might be image-based or corrupted`);
    }
    
    return finalText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error}`);
  }
}

/* =====================================================
   TEXT CHUNKING
===================================================== */
function splitTextIntoChunks(
  text: string,
  maxChunkSize: number = 1200
): string[] {
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const chunks: string[] = [];

  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence + ". ";
    } else {
      currentChunk += sentence + ". ";
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/* =====================================================
   EMBEDDING GENERATION
===================================================== */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 512, // Fixed: Using 512 dimensions to match vector search
  });

  return response.data[0].embedding;
}

/* =====================================================
   VECTOR SEARCH FOR RAG
===================================================== */
async function searchSimilarContent(
  query: string,
  limit: number = 5
): Promise<any[]> {
  try {
    const queryEmbedding = await generateEmbedding(query);
    const collection = mongoose.connection.db!.collection(
      "knowledge_embeddings"
    );

    // Vector search using MongoDB Atlas Vector Search
    const searchResults = await collection
      .aggregate([
        {
          $vectorSearch: {
            index: "university_rag_vector_index", // Make sure you have this index in MongoDB
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: 100,
            limit: limit,
          },
        },
        {
          $project: {
            content: 1,
            domain: 1,
            fileName: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ])
      .toArray();

    return searchResults;
  } catch (error) {
    console.error("Vector search error:", error);
    throw new Error(`Vector search failed: ${error}`);
  }
}

/* =====================================================
   RAG RESPONSE GENERATION FOR UNIVERSITY ASSISTANT
===================================================== */
async function generateRAGResponse(
  query: string,
  relevantContent: any[]
): Promise<{ answer: string; source: string | null }> {
  try {
    console.log(`🤖 generateRAGResponse called with ${relevantContent.length} content items`);
    
    if (relevantContent.length === 0) {
      console.log("❌ No content provided to generateRAGResponse");
      return {
        answer: "I couldn't find any relevant information to answer your question.",
        source: null
      };
    }

    // Check if we have uploaded content in the context
    const hasUploadedContent = relevantContent.some(item => item.domain === "uploaded_context");
    const uploadedItems = relevantContent.filter(item => item.domain === "uploaded_context");
    
    console.log(`🤖 Generating response - Total items: ${relevantContent.length}`);
    console.log(`🤖 Has uploaded content: ${hasUploadedContent}`);
    console.log(`🤖 Uploaded items count: ${uploadedItems.length}`);
    console.log(`🤖 Uploaded items preview:`, uploadedItems.slice(0, 1).map(item => ({ 
      domain: item.domain, 
      contentLength: item.content.length,
      contentPreview: item.content.substring(0, 150) + "..." 
    })));
    
    const context = relevantContent
      .map((item) => `${item.content}`)
      .join("\n\n");
      
    console.log(`🤖 Context length: ${context.length} characters`);
    console.log(`🤖 Context preview (first 400 chars): ${context.substring(0, 400)}...`);

    // Get the highest scoring source from existing database (not uploaded content)
    const existingDbSources = relevantContent.filter(item => 
      item.domain !== "uploaded_context" && 
      item.fileName !== "Uploaded document"
    );
    
    const topSource = existingDbSources.length > 0 
      ? existingDbSources[0] 
      : { fileName: "Uploaded documents", domain: "university" };

    // Use more permissive prompt when we have uploaded content
    const systemPrompt = hasUploadedContent 
      ? `You are a university assistant. Answer questions based on the provided context from university documents and uploaded files.

GUIDELINES:
- Use the information provided in the context to answer the question
- Prioritize information from uploaded documents when available
- If you find relevant information in the context, provide a helpful and detailed answer
- Be informative and give specific details from the documents
- Give comprehensive answers that directly address the user's question
- If the context contains partial information, provide what you can and mention what aspects might need more information
- Focus on the most relevant information from the context`
      : `You are a university assistant. Answer questions STRICTLY based on the provided context from university documents.

STRICT GUIDELINES:
- Answer ONLY based on the information provided in the context
- Do NOT use general knowledge or information outside the context
- If the context doesn't contain enough information, say "The provided documents do not contain sufficient information to answer this question"
- Give direct, concise answers in 2-3 lines maximum`;

    console.log(`🤖 Using ${hasUploadedContent ? 'PERMISSIVE' : 'STRICT'} prompt mode`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Context from university documents: ${context}

Question: ${query}

Answer based on the information provided in the context above:`,
        },
      ],
      temperature: 0.2,
      max_tokens: 300,
    });

    const answer = completion.choices[0].message.content || "I couldn't generate a response from the provided documents.";
    
    console.log(`🤖 Generated answer length: ${answer.length} characters`);
    console.log(`🤖 Generated answer preview: ${answer.substring(0, 200)}...`);

    return {
      answer: answer,
      source: hasUploadedContent ? "Uploaded documents + University data" : (topSource?.fileName || topSource?.domain || "University documents")
    };
  } catch (error) {
    console.error("RAG response generation error:", error);
    throw new Error(`Failed to generate response: ${error}`);
  }
}

/* =====================================================
   MAIN CONTROLLER
===================================================== */
const uploadFile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const _req = req as AuthRequest;

  try {
    /* -----------------------------
       VALIDATE FILES
    ----------------------------- */
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw createHttpError(400, "At least one PDF is required");
    }

    if (files.length > 3) {
      throw createHttpError(400, "Maximum 3 PDFs allowed");
    }

    for (const file of files) {
      if (file.mimetype !== "application/pdf") {
        throw createHttpError(400, "Only PDF files are allowed");
      }
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const collection = mongoose.connection.db!.collection(
      "knowledge_embeddings"
    );

    const processedFiles: any[] = [];

    /* -----------------------------
       PROCESS EACH PDF
    ----------------------------- */
    for (const file of files) {
      const localPath = path.join(
        __dirname,
        "../../public/data/uploads",
        file.filename
      );

      try {
        // 1️⃣ Upload PDF to Cloudinary
        const uploaded = await cloudinary.uploader.upload(localPath, {
          resource_type: "raw",
          folder: "user-pdfs",
          filename_override: file.originalname,
        });

        // 2️⃣ Extract text using pdfjs-dist
        const extractedText = await extractTextFromPDF(localPath);

        if (!extractedText) {
          throw new Error("No text extracted (possibly scanned PDF)");
        }

        // 3️⃣ Chunk text
        const chunks = splitTextIntoChunks(extractedText);

        // 4️⃣ Generate embeddings + store
        for (let i = 0; i < chunks.length; i++) {
          const embedding = await generateEmbedding(chunks[i]);

          await collection.insertOne({
            content: chunks[i],
            embedding,
            domain: "user_uploaded",
            fileName: file.originalname,
            chunkIndex: i,
            cloudinaryUrl: uploaded.secure_url,
            uploadedBy: _req.userId || "anonymous",
            createdAt: new Date(),
          });
        }

        processedFiles.push({
          fileName: file.originalname,
          chunksStored: chunks.length,
          status: "success",
        });

        // cleanup local file
        fs.unlinkSync(localPath);
      } catch (err: any) {
        processedFiles.push({
          fileName: file.originalname,
          status: "failed",
          error: err.message,
        });
      }
    }

    /* -----------------------------
       RESPONSE
    ----------------------------- */
    return res.status(201).json({
      message: "PDFs processed successfully",
      files: processedFiles,
    });
  } catch (error) {
    next(error);
  }
};

/* =====================================================
   UPLOAD PDF + RAG RESPONSE API
===================================================== */
const uploadAndQuery = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const _req = req as AuthRequest;
  const { query } = req.body;

  try {
    if (!query) {
      throw createHttpError(400, "Query is required");
    }

    /* -----------------------------
       VALIDATE FILES
    ----------------------------- */
    
    // Handle multer.fields() structure: req.files is an object with field names as keys
    const filesObj = req.files as { [fieldname: string]: Express.Multer.File[] };
    const files = filesObj?.files || [];

    if (!files || files.length === 0) {
      throw createHttpError(400, "At least one PDF is required");
    }

    if (files.length > 3) {
      throw createHttpError(400, "Maximum 3 PDFs allowed");
    }

    for (const file of files) {
      if (file.mimetype !== "application/pdf") {
        throw createHttpError(400, "Only PDF files are allowed");
      }
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const collection = mongoose.connection.db!.collection(
      "knowledge_embeddings"
    );

    /* -----------------------------
       FIRST: EXTRACT CONTENT FROM UPLOADED FILES
    ----------------------------- */
    console.log(`📄 Extracting content from ${files.length} uploaded files...`);
    
    const uploadedContent: string[] = [];
    const processedFiles: any[] = [];

    for (const file of files) {
      const localPath = path.join(
        __dirname,
        "../../public/data/uploads",
        file.filename
      );

      try {
        // 1️⃣ Upload PDF to Cloudinary
        const uploaded = await cloudinary.uploader.upload(localPath, {
          resource_type: "raw",
          folder: "user-pdfs",
          filename_override: file.originalname,
        });

        // 2️⃣ Extract text using pdfjs-dist
        console.log(`🔍 Extracting text from: ${file.originalname}`);
        const extractedText = await extractTextFromPDF(localPath);
        console.log(`📏 Extracted text length: ${extractedText?.length || 0} characters`);
        
        if (!extractedText || extractedText.trim().length === 0) {
          console.error(`❌ No text extracted from ${file.originalname} (possibly scanned PDF)`);
          console.log(`📄 Raw extracted value: "${extractedText}"`);
          throw new Error("No text extracted (possibly scanned PDF)");
        }

        console.log(`📄 Text preview (first 300 chars): ${extractedText.substring(0, 300)}...`);
        console.log(`📄 Text middle (chars 1000-1300): ${extractedText.substring(1000, 1300)}...`);

        // Store extracted content for immediate use in response
        uploadedContent.push(extractedText);
        console.log(`✅ Added extracted content to uploadedContent array. Total files: ${uploadedContent.length}`);

        // Check if file already exists in database
        const existingFile = await collection.findOne({
          fileName: file.originalname,
          domain: "user_uploaded"
        });

        if (existingFile) {
          console.log(`📋 File ${file.originalname} already exists in database, skipping storage`);
          processedFiles.push({
            fileName: file.originalname,
            status: "already_exists",
            message: "File already stored in database"
          });
        } else {
          // 3️⃣ Chunk text for database storage (only if file doesn't exist)
          const chunks = splitTextIntoChunks(extractedText);

          // 4️⃣ Generate embeddings + store for future use
          console.log(`💾 Storing ${chunks.length} chunks for ${file.originalname}`);
          for (let i = 0; i < chunks.length; i++) {
            const embedding = await generateEmbedding(chunks[i]);

            await collection.insertOne({
              content: chunks[i],
              embedding,
              domain: "user_uploaded",
              fileName: file.originalname,
              chunkIndex: i,
              cloudinaryUrl: uploaded.secure_url,
              uploadedBy: _req.userId || "anonymous",
              createdAt: new Date(),
            });
          }

          processedFiles.push({
            fileName: file.originalname,
            chunksStored: chunks.length,
            status: "success",
          });
        }

        // cleanup local file
        fs.unlinkSync(localPath);
      } catch (err: any) {
        processedFiles.push({
          fileName: file.originalname,
          status: "failed",
          error: err.message,
        });
      }
    }

    /* -----------------------------
       SECOND: SEARCH EXISTING DATABASE AND COMBINE WITH UPLOADED CONTENT
    ----------------------------- */
    console.log(`🔍 Searching existing database for: ${query}`);
    
    // Search existing database
    const existingContent = await searchSimilarContent(query, 3);
    
    console.log(`📄 Found ${existingContent.length} relevant chunks from existing data`);
    console.log(`📄 Extracted ${uploadedContent.length} documents from upload`);
    console.log(`📄 Total uploaded content length: ${uploadedContent.reduce((acc, content) => acc + content.length, 0)} characters`);
    
    if (uploadedContent.length === 0) {
      console.error(`❌ CRITICAL: uploadedContent array is EMPTY! This is the problem!`);
      console.error(`Upload processing might have failed for all files`);
    }
    
    // Combine existing database content with newly uploaded content
    const combinedContent = [
      ...existingContent,
      // Add uploaded content as high-relevance items (chunked for better processing)
      ...uploadedContent.flatMap(content => {
        console.log(`🔧 Processing uploaded content of length: ${content.length}`);
        if (!content || content.trim().length === 0) {
          console.error(`❌ Empty content detected in uploadedContent array!`);
          return [];
        }
        const chunks = splitTextIntoChunks(content, 800); // Smaller chunks for better context
        console.log(`🔧 Created ${chunks.length} chunks from uploaded content`);
        return chunks.map((chunk, index) => ({
          content: chunk,
          score: 0.95, // Very high relevance score for uploaded content
          domain: "uploaded_context",
          fileName: "Uploaded document",
          chunkIndex: index
        }));
      })
    ];

    console.log(`📊 Total context items: ${combinedContent.length}`);
    console.log(`📊 Uploaded context items: ${combinedContent.filter(item => item.domain === "uploaded_context").length}`);
    console.log(`📊 Existing DB items: ${combinedContent.filter(item => item.domain !== "uploaded_context").length}`);
    console.log(`📝 Context preview:`, combinedContent.slice(0, 2).map(item => ({ 
      domain: item.domain, 
      contentPreview: item.content.substring(0, 100) + "..." 
    })));

    console.log(`📊 CRITICAL DEBUG - BEFORE generateRAGResponse:`);
    console.log(`📊 uploadedContent length: ${uploadedContent.length}`);
    console.log(`📊 combinedContent length: ${combinedContent.length}`);
    console.log(`📊 combinedContent breakdown:`, {
      uploadedItems: combinedContent.filter(item => item.domain === "uploaded_context").length,
      existingItems: combinedContent.filter(item => item.domain !== "uploaded_context").length
    });
    
    if (uploadedContent.length > 0) {
      console.log(`📊 First uploadedContent sample: ${uploadedContent[0].substring(0, 200)}...`);
    }

    // Generate RAG response from combined context
    const ragResponse = await generateRAGResponse(query, combinedContent);

    console.log(`✅ Processed ${processedFiles.length} files for future use`);

    /* -----------------------------
       RESPONSE (Based on existing data + uploaded content)
    ----------------------------- */
    return res.status(200).json({
      answer: ragResponse.answer,
      source: ragResponse.source
    });
  } catch (error) {
    next(error);
  }
};

/* =====================================================
   QUERY ONLY API (WITHOUT PDF UPLOAD)
===================================================== */
const queryDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { query } = req.body;

  try {
    if (!query) {
      throw createHttpError(400, "Query is required");
    }

    console.log(`🔍 Searching for: ${query}`);
    
    // Search existing database
    const relevantContent = await searchSimilarContent(query, 5);
    
    console.log(`📄 Found ${relevantContent.length} relevant chunks`);
    
    // Generate RAG response
    const ragResponse = await generateRAGResponse(query, relevantContent);
    
    return res.status(200).json({
      answer: ragResponse.answer,
      source: ragResponse.source
    });
  } catch (error) {
    next(error);
  }
};

export { uploadFile, uploadAndQuery, queryDocuments };

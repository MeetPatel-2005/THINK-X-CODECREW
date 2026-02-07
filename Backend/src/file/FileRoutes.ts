import express from "express";
import multer from "multer";
import path from "path";
import { uploadFile, uploadAndQuery } from "./FileController.js";

const fileRouter = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/data/uploads/"); // Upload directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  // Only allow PDF files
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 3, // Maximum 3 files
  },
});

// Configure multer for file uploads with fields
const uploadFields = upload.fields([
  { name: 'files', maxCount: 3 },  // PDF files
  { name: 'query', maxCount: 1 }   // Query text
]);

// Routes
// POST /api/files/upload - Upload PDFs only (no query)
fileRouter.post(
  "/upload",
  (req, res, next) => {
    console.log("📤 File upload only route hit");
    console.log("Content-Type:", req.headers["content-type"]);
    next();
  },
  upload.array("files", 3),
  (req, res, next) => {
    console.log("📁 After multer - req.files:", req.files);
    next();
  },
  uploadFile,
);

// POST /api/files/upload-and-query - Upload PDFs + Get RAG Response
fileRouter.post(
  "/upload-and-query",
  (req, res, next) => {
    console.log("📤📋 File upload + query route hit");
    console.log("Content-Type:", req.headers["content-type"]);
    next();
  },
  uploadFields,
  (req, res, next) => {
    console.log("📁 After multer - req.files:", req.files);
    console.log("📝 Query:", req.body.query);
    next();
  },
  uploadAndQuery,
);

export default fileRouter;

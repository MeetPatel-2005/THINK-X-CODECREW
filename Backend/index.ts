import dotenv from "dotenv";

import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { config } from "./src/config/config.js";

dotenv.config();

const startServer = async () => {
  try {
    await connectDB();

    const port = process.env.PORT || config.port || 3000;

    app.listen(port, () => {
      console.log(`University RAG server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

import { config as conf } from "dotenv";
conf();

const _config = {
    port: process.env.PORT,
    databaseUrl: process.env.MONGO_CONNECTION_STRING,
    openrouterApiKey: process.env.OPENAI_API_KEY,
    openrouterBaseUrl: process.env.OPENROUTER_BASE_URL,
    cloudinaryCloud: process.env.CLOUDINARY_CLOUD,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinarySecret: process.env.CLOUDINARY_API_SECRET,
    frontendDomain: process.env.FRONTEND_DOMAIN,
    jwtSecret: process.env.JWT_SECRET,
}

export const config = Object.freeze(_config);

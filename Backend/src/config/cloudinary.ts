import { v2 as cloudinary } from "cloudinary";
import { config } from "./config.ts";

// Configuration
cloudinary.config({ 
    cloud_name: config.cloudinaryCloud as string, 
    api_key: config.cloudinaryApiKey as string, 
    api_secret: config.cloudinarySecret as string // Click 'View API Keys' above to copy your API secret
});

export default cloudinary;
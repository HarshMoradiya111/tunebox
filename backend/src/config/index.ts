import dotenv from "dotenv";
import path from "path";

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const config = {
  // Server
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  publicBaseUrl: process.env.BACKEND_PUBLIC_URL || "http://localhost:5000",

  // MongoDB
  mongoUri:
    process.env.MONGODB_URI || "mongodb://localhost:27017/spotify-clone",

  // Spotify API
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID || "",
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
    redirectUri:
      process.env.SPOTIFY_REDIRECT_URI ||
      "http://localhost:5000/api/auth/callback",
  },

  // YouTube Download Proxy (to avoid 429 Too Many Requests on cloud IPs)
  youtubeProxy: process.env.YOUTUBE_PROXY || "",

  // Cloudflare R2 (Phase 9)
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    bucketName: process.env.R2_BUCKET_NAME || "",
    publicUrl: process.env.R2_PUBLIC_URL || "",
  },

  // JWT
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",

  // Library path (local audio storage)
  libraryPath: path.resolve(__dirname, "../../library"),
};

export default config;

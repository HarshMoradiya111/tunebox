import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import config from "./config";
import connectDB from "./config/database";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware";

const app = express();

// ---------------------
// Middleware
// ---------------------
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------
// Routes
// ---------------------
app.use("/api", routes);

// ---------------------
// Error Handling
// ---------------------
app.use(notFoundHandler);
app.use(errorHandler);

// ---------------------
// Start Server
// ---------------------
const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  app.listen(config.port, () => {
    console.log(`
  🎵 Spotify Clone API Server
  ───────────────────────────
  🌍 Environment : ${config.nodeEnv}
  🚀 Port        : ${config.port}
  📡 API URL     : http://localhost:${config.port}/api
  🩺 Health      : http://localhost:${config.port}/api/health
  ───────────────────────────
    `);
  });
};

startServer().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});

export default app;

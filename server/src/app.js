import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import examCoachRoutes from "./routes/examCoachRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import codingRoutes from "./routes/codingRoutes.js";

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: [process.env.CLIENT_URL || "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
    credentials: true,
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

// Parsing Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/exam-coach", examCoachRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/coding", codingRoutes);

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "AI Learning Hub Backend is running" });
});

export default app;

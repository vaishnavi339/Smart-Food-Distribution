import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.GEMINI_API_KEY?.trim();

if (!apiKey) {
  console.error("Missing GEMINI_API_KEY in environment.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("combined"));

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

app.post("/ai", async (req, res) => {
  try {
    const { prompt } = req.body ?? {};

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required and must be a non-empty string.",
      });
    }

    const result = await model.generateContent({
  contents: [
    {
      role: "user",
      parts: [{ text: prompt.trim() }]
    }
  ]
});

const text = result?.response?.text?.() ?? "";

    return res.status(200).json({
      success: true,
      response: text,
    });
  } catch (error) {
    console.error("Gemini API error:", error);

    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to generate AI response.",
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

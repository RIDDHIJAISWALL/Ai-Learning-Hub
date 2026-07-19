import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

try {
    const chunks = ["This is a test message to query"];
    const response = await ai.models.embedContent({
        model: 'text-embedding-004',
        contents: chunks,
    });
    console.log("Embeddings length:", response.embeddings?.length);
} catch (e) {
    console.error(e.message);
}
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY is not defined in the environment variables!');
}

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

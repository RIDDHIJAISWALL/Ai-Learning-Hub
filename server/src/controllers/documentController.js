import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { OpenAIEmbeddings } from '@langchain/openai';
import UploadedNote from '../models/UploadedNote.js';
import NoteEmbedding from '../models/NoteEmbedding.js';

// @desc    Upload PDF, extract text, chunk and embed
// @route   POST /api/documents/upload
// @access  Private
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;

    // 1. Extract text using pdf-parse
    const pdfData = await pdfParse(fileBuffer);
    const text = pdfData.text;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Could not extract text from PDF' });
    }

    // 2. Chunk text using LangChain
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await textSplitter.splitText(text);

    // 3. Save UploadedNote record
    const note = await UploadedNote.create({
      userId: req.user._id,
      fileName,
      fileSize,
    });

    // If there is no OpenAI API key, we skip embedding creation to avoid crashing
    if (!process.env.OPENAI_API_KEY) {
      return res.status(201).json({
        message: 'File uploaded and text extracted. Embeddings skipped due to missing OPENAI_API_KEY.',
        note,
      });
    }

    // 4. Generate embeddings and save to DB
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY || "dummy_key_to_prevent_crash"
    });

    // Process in batches if there are many chunks to prevent rate limiting
    const noteEmbeddings = [];
    
    // For simplicity, embed all at once (OpenAI handles up to 2048 arrays at once usually)
    const vectors = await embeddings.embedDocuments(chunks);

    for (let i = 0; i < chunks.length; i++) {
      noteEmbeddings.push({
        noteId: note._id,
        userId: req.user._id,
        textChunk: chunks[i],
        embedding: vectors[i],
      });
    }

    await NoteEmbedding.insertMany(noteEmbeddings);

    res.status(201).json({
      message: 'File processed and embeddings saved successfully',
      note,
      chunksCount: chunks.length,
    });
  } catch (error) {
    console.error('Error in uploadDocument:', error);
    res.status(500).json({ message: 'Server error during document processing' });
  }
};

// @desc    Get all user documents
// @route   GET /api/documents
// @access  Private
export const getDocuments = async (req, res) => {
  try {
    const documents = await UploadedNote.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(documents);
  } catch (error) {
    console.error('Error in getDocuments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

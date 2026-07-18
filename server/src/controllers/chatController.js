import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import NoteEmbedding from '../models/NoteEmbedding.js';
import dotenv from 'dotenv';
import { ai } from '../lib/gemini.js';

dotenv.config();

// Helper to calculate Cosine Similarity between vectors in memory
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return normA && normB ? dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
};

// Define system prompts for different assistants
const getSystemPrompt = (assistantType) => {
  switch (assistantType) {
    case 'Tutor':
      return "You are an AI Personal Tutor. You are patient, encouraging, and break down complex concepts into simple, easy-to-understand explanations. Ask guiding questions to help the student learn.";
    case 'CodingTutor':
      return "You are an expert AI Coding Tutor. Provide clear, concise code examples, explain how they work, and follow best practices. When fixing bugs, explain why the bug occurred.";
    case 'ExamCoach':
      return "You are an AI Exam Preparation Coach. You help students create study plans, test their knowledge with quizzes, and manage study time efficiently.";
    case 'NotesExplainer':
      return "You are an AI Notes Explainer. You summarize documents, extract key entities, and answer questions specifically based on the provided context.";
    case 'InterviewTrainer':
      return "You are an AI Interview Trainer. You act as an interviewer, asking one question at a time, evaluating the user's response, and providing constructive feedback before moving to the next question.";
    default:
      return "You are a helpful AI assistant.";
  }
};

// @desc    Create a new chat
// @route   POST /api/chats
// @access  Private
export const createChat = async (req, res) => {
  try {
    const { assistantType, title } = req.body;

    if (!assistantType) {
      return res.status(400).json({ message: 'assistantType is required' });
    }

    const chat = await Chat.create({
      userId: req.user._id,
      assistantType,
      title: title || `New ${assistantType} Chat`,
    });

    res.status(201).json(chat);
  } catch (error) {
    console.error('Error in createChat:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all user chats
// @route   GET /api/chats
// @access  Private
export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.status(200).json(chats);
  } catch (error) {
    console.error('Error in getChats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get chat messages
// @route   GET /api/chats/:id/messages
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const messages = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error in getMessages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send message and get AI response with SSE streaming
// @route   POST /api/chats/:id/messages
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Save user message to DB
    const userMessage = await Message.create({
      chatId: chat._id,
      role: 'user',
      content,
    });

    // Fetch previous messages for context
    const previousMessages = await Message.find({ chatId: chat._id })
      .sort({ createdAt: 1 })
      .limit(10);

    // Formulate Context for NotesExplainer using RAG
    let contextDocs = '';
    if (chat.assistantType === 'NotesExplainer') {
      try {
        if (process.env.GEMINI_API_KEY) {
          const response = await ai.models.embedContent({
            model: 'text-embedding-004',
            contents: content,
          });
          const queryVector = response.embeddings?.[0]?.values;

          if (queryVector) {
            try {
              const results = await NoteEmbedding.aggregate([
                {
                  $vectorSearch: {
                    index: 'vector_index',
                    path: 'embedding',
                    queryVector: queryVector,
                    numCandidates: 100,
                    limit: 5,
                  }
                },
                { $match: { userId: chat.userId } },
                { $project: { textChunk: 1 } }
              ]);
              if (results && results.length > 0) {
                contextDocs = "Context from uploaded notes:\n" + results.map(r => r.textChunk).join('\n\n');
              } else {
                throw new Error("No Atlas Vector results found");
              }
            } catch (err) {
              // Local/In-memory vector search fallback
              const noteEmbeds = await NoteEmbedding.find({ userId: chat.userId });
              if (noteEmbeds && noteEmbeds.length > 0) {
                const scored = noteEmbeds.map(doc => ({
                  textChunk: doc.textChunk,
                  similarity: cosineSimilarity(queryVector, doc.embedding)
                }));
                scored.sort((a, b) => b.similarity - a.similarity);
                const top5 = scored.slice(0, 5);
                contextDocs = "Context from uploaded notes:\n" + top5.map(r => r.textChunk).join('\n\n');
              }
            }
          }
        }
      } catch (err) {
        console.warn('RAG retrieval failed:', err.message);
      }
    }

    // Headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send the user's message object first so client has it in UI
    res.write(`data: ${JSON.stringify({ type: 'user_message', message: userMessage })}\n\n`);

    const systemPromptContent = getSystemPrompt(chat.assistantType) + (contextDocs ? `\n\n${contextDocs}` : '');

    if (!process.env.GEMINI_API_KEY) {
      // Mock stream
      const mockText = `[Mock Mode] This is a simulated response from the AI ${chat.assistantType} agent. To get real AI answers, configure your GEMINI_API_KEY in the backend .env file. You asked: "${content}"`;

      const words = mockText.split(' ');
      let index = 0;

      const interval = setInterval(async () => {
        if (index < words.length) {
          const chunk = words[index] + ' ';
          res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
          index++;
        } else {
          clearInterval(interval);
          // Save mock message to DB
          const assistantMessage = await Message.create({
            chatId: chat._id,
            role: 'assistant',
            content: mockText,
          });
          chat.updatedAt = Date.now();
          await chat.save();
          res.write(`data: ${JSON.stringify({ type: 'done', message: assistantMessage })}\n\n`);
          res.end();
        }
      }, 50);

      req.on('close', () => {
        clearInterval(interval);
      });
      return;
    }

    const contents = previousMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Call Gemini generateContentStream
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-flash-latest",
      contents,
      config: {
        systemInstruction: systemPromptContent,
        temperature: 0.7,
      }
    });

    let fullResponse = '';
    for await (const chunk of responseStream) {
      const token = chunk.text || '';
      if (token) {
        fullResponse += token;
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }

    // Save AI response to DB
    const assistantMessage = await Message.create({
      chatId: chat._id,
      role: 'assistant',
      content: fullResponse,
    });

    // Update chat timestamp
    chat.updatedAt = Date.now();
    await chat.save();

    res.write(`data: ${JSON.stringify({ type: 'done', message: assistantMessage })}\n\n`);
    res.end();

  } catch (error) {
    console.error("Gemini Error:", error);

    res.write(
      `data: ${JSON.stringify({
        type: "error",
        message: error.message,
      })}\n\n`


    )
    res.end();
  }
};


//   } catch (error) {
//     console.error('Error in sendMessage:', error);
//     res.write(`data: ${JSON.stringify({ type: 'error', message: 'Server error when contacting AI' })}\n\n`);
//     res.end();
//   }
// };

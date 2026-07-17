import OpenAI from 'openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import NoteEmbedding from '../models/NoteEmbedding.js';
import dotenv from 'dotenv';

dotenv.config();

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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key_to_prevent_crash",
});

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

// @desc    Send message and get AI response
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

    // Fetch previous messages for context (limit to last 10 for token optimization)
    const previousMessages = await Message.find({ chatId: chat._id })
      .sort({ createdAt: 1 })
      .limit(10);

    // Formulate Context for NotesExplainer using RAG
    let contextDocs = '';
    if (chat.assistantType === 'NotesExplainer' && process.env.OPENAI_API_KEY) {
      const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY || "dummy_key_to_prevent_crash" });
      const queryVector = await embeddings.embedQuery(content);

      // We use standard $near or $vectorSearch (Atlas)
      // Since this is a generic implementation, we use $vectorSearch syntax assuming Atlas setup
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
          {
            $match: { userId: chat.userId } // filter by user
          },
          {
            $project: { textChunk: 1, score: { $meta: "vectorSearchScore" } }
          }
        ]);
        
        if (results && results.length > 0) {
          contextDocs = "Context from uploaded notes:\n" + results.map(r => r.textChunk).join('\n\n');
        } else {
          contextDocs = "No relevant context found in uploaded notes.";
        }
      } catch (err) {
        console.warn('Vector search failed, perhaps index is not set up:', err.message);
        contextDocs = "Note: Vector search index is not fully configured, answering from general knowledge.";
      }
    }

    // Format for OpenAI API
    const systemPromptContent = getSystemPrompt(chat.assistantType) + (contextDocs ? `\n\n${contextDocs}` : '');
    const formattedMessages = [
      { role: 'system', content: systemPromptContent },
      ...previousMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Check if we have an API key, if not return a mock response for now
    if (!process.env.OPENAI_API_KEY) {
      const mockResponse = await Message.create({
        chatId: chat._id,
        role: 'assistant',
        content: `[Mock Mode] OPENAI_API_KEY is not set. You said: "${content}". Please configure your API key to get real AI responses.`,
      });
      chat.updatedAt = Date.now();
      await chat.save();
      return res.status(200).json(mockResponse);
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: formattedMessages,
      temperature: 0.7,
    });

    const aiContent = completion.choices[0].message.content;

    // Save AI response to DB
    const assistantMessage = await Message.create({
      chatId: chat._id,
      role: 'assistant',
      content: aiContent,
    });

    // Update chat timestamp
    chat.updatedAt = Date.now();
    await chat.save();

    res.status(200).json(assistantMessage);
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ message: 'Server error when contacting AI' });
  }
};

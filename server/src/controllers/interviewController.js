import OpenAI from 'openai';
import dotenv from 'dotenv';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key_to_prevent_crash",
});

// @desc    Generate interview feedback and score
// @route   POST /api/interview/feedback
// @access  Private
export const generateFeedback = async (req, res) => {
  try {
    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: 'chatId is required' });
    }

    const chat = await Chat.findOne({ _id: chatId, userId: req.user._id });
    if (!chat || chat.assistantType !== 'InterviewTrainer') {
      return res.status(404).json({ message: 'Interview chat not found' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({
        feedback: {
          overallScore: 85,
          strengths: ["Mock Strength 1", "Mock Strength 2"],
          areasForImprovement: ["Mock Area 1"],
          finalThoughts: "Set an API key to get real interview feedback."
        }
      });
    }

    const messages = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 });
    
    // Create a transcript from messages
    const transcript = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

    const systemPrompt = `You are an expert Interview Evaluator. 
Review the following interview transcript between the ASSISTANT (Interviewer) and USER (Candidate).
Evaluate the candidate's performance and provide a structured JSON response matching this exact structure:
{
  "overallScore": number (0-100),
  "strengths": ["string"],
  "areasForImprovement": ["string"],
  "finalThoughts": "string"
}
Only output the JSON object.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcript }
      ],
      temperature: 0.5,
    });

    const aiContent = completion.choices[0].message.content;
    const feedback = JSON.parse(aiContent);

    res.status(200).json({ feedback });
  } catch (error) {
    console.error('Error in generateFeedback:', error);
    res.status(500).json({ message: 'Server error when generating feedback' });
  }
};

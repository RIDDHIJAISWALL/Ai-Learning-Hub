import OpenAI from 'openai';
import dotenv from 'dotenv';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import InterviewSession from '../models/InterviewSession.js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key_to_prevent_crash",
});

// Helper mock questions for different roles
const getMockQuestions = (role) => {
  const normalizedRole = role.toLowerCase();
  if (normalizedRole.includes('frontend') || normalizedRole.includes('react')) {
    return [
      "What is the difference between Virtual DOM and Real DOM in React?",
      "Explain the concept of closures in JavaScript and give an example.",
      "How do you optimize performance in a Next.js web application?",
      "What is the difference between client-side state management (like Redux or Zustand) and React Context?"
    ];
  } else if (normalizedRole.includes('backend') || normalizedRole.includes('node')) {
    return [
      "How does Node.js handle concurrency despite being single-threaded?",
      "What is the difference between SQL and NoSQL databases? When would you use which?",
      "Explain how JWT authentication works in a REST API.",
      "How do you design a scalable caching layer using Redis for your backend APIs?"
    ];
  } else if (normalizedRole.includes('mern')) {
    return [
      "Explain the flow of data from React frontend to Node/Express backend and MongoDB.",
      "How do you handle schema validation in Mongoose?",
      "How do you deploy a complete MERN stack application on Render/Vercel?",
      "What is CORS and how do you resolve it in an Express backend?"
    ];
  } else if (normalizedRole.includes('java')) {
    return [
      "What is the difference between an abstract class and an interface in Java?",
      "Explain Java Memory Management and garbage collection mechanisms.",
      "What is Spring Boot and how does dependency injection work in it?",
      "How do you handle exception handling in a REST controller in Java Spring?"
    ];
  } else if (normalizedRole.includes('python') || normalizedRole.includes('ai')) {
    return [
      "What is the difference between lists and tuples in Python?",
      "Explain decorator functions in Python with a real-world use case.",
      "What is Retrieval-Augmented Generation (RAG) and how does it work?",
      "Explain the difference between supervised and unsupervised machine learning."
    ];
  } else {
    return [
      `What are your key technical strengths as a ${role}?`,
      "Tell me about a challenging technical project you worked on and how you resolved the obstacles.",
      "How do you approach debugging a production-level system crash?",
      "Where do you see yourself in terms of technical growth over the next two years?"
    ];
  }
};

// @desc    Start interview session
// @route   POST /api/interview/start
// @access  Private
export const startInterview = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: 'role is required' });
    }

    // 1. Create a Chat record
    const chat = await Chat.create({
      userId: req.user._id,
      assistantType: 'InterviewTrainer',
      title: `${role} Mock Interview`,
    });

    let questions = [];

    if (!process.env.OPENAI_API_KEY) {
      questions = getMockQuestions(role);
    } else {
      try {
        const systemPrompt = `You are an AI Technical Interviewer. 
Generate a list of exactly 4 specialized technical interview questions for the role of: "${role}".
Make the questions progressive (easy to hard).
You MUST respond in valid JSON format matching this exact structure:
{
  "questions": ["string"]
}
Only output the JSON object.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          response_format: { type: "json_object" },
          messages: [{ role: 'system', content: systemPrompt }],
          temperature: 0.8,
        });

        const parsed = JSON.parse(completion.choices[0].message.content);
        questions = parsed.questions || getMockQuestions(role);
      } catch (err) {
        console.warn('OpenAI failed to generate interview questions, using mock questions:', err.message);
        questions = getMockQuestions(role);
      }
    }

    // 2. Create InterviewSession record
    const session = await InterviewSession.create({
      userId: req.user._id,
      chatId: chat._id,
      role,
      questions,
      answers: [],
      feedbacks: [],
      currentQuestionIndex: 0,
      status: 'in_progress',
    });

    // 3. Save first question as AI message
    await Message.create({
      chatId: chat._id,
      role: 'assistant',
      content: `Hello! I will be your interviewer today for the ${role} position. Let's get started. Here is your first question:\n\n**${questions[0]}**`,
    });

    res.status(201).json({
      chatId: chat._id,
      sessionId: session._id,
      role,
      firstQuestion: questions[0],
    });
  } catch (error) {
    console.error('Error in startInterview:', error);
    res.status(500).json({ message: 'Server error when starting interview' });
  }
};

// @desc    Submit answer and get next question
// @route   POST /api/interview/answer
// @access  Private
export const submitAnswer = async (req, res) => {
  try {
    const { chatId, answer } = req.body;

    if (!chatId || !answer) {
      return res.status(400).json({ message: 'chatId and answer are required' });
    }

    const session = await InterviewSession.findOne({ chatId, userId: req.user._id });
    if (!session || session.status !== 'in_progress') {
      return res.status(404).json({ message: 'Active interview session not found' });
    }

    const currentQ = session.questions[session.currentQuestionIndex];

    // Save user's answer message in Chat
    await Message.create({
      chatId,
      role: 'user',
      content: answer,
    });

    let individualFeedback = "Answer recorded.";

    if (process.env.OPENAI_API_KEY) {
      try {
        const systemPrompt = `You are a critical Technical Interviewer.
Review the question and the user's answer. Provide a short critique (2-3 sentences) pointing out if it's correct, partially correct, or missing key details. Be constructive.`;
        
        const prompt = `Question: ${currentQ}\nUser's Answer: ${answer}`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.6,
        });

        individualFeedback = completion.choices[0].message.content;
      } catch (err) {
        console.warn('OpenAI answer critique failed:', err.message);
      }
    }

    // Save answers & feedbacks in session
    session.answers.push(answer);
    session.feedbacks.push(individualFeedback);
    session.currentQuestionIndex += 1;

    // Check if there are more questions
    if (session.currentQuestionIndex < session.questions.length) {
      const nextQ = session.questions[session.currentQuestionIndex];
      
      // Save Next Question message in Chat
      const nextQMsg = `**Feedback on last answer:** ${individualFeedback}\n\n**Next Question:**\n${nextQ}`;
      await Message.create({
        chatId,
        role: 'assistant',
        content: nextQMsg,
      });

      await session.save();

      return res.status(200).json({
        isFinished: false,
        feedback: individualFeedback,
        nextQuestion: nextQ,
        currentQuestionIndex: session.currentQuestionIndex,
      });
    } else {
      // Completed! Compute overall feedback
      session.status = 'completed';
      
      let overallReport = {
        overallScore: 80,
        strengths: ["Clear communication", "Demonstrated basic knowledge"],
        areasForImprovement: ["Provide deeper architecture details in answers"],
        finalThoughts: "Solid performance. Study optimization and deployment configurations."
      };

      if (process.env.OPENAI_API_KEY) {
        try {
          const transcript = session.questions.map((q, idx) => `Q: ${q}\nA: ${session.answers[idx]}`).join('\n\n');
          const systemPrompt = `You are an expert Senior Developer conducting an interview review.
Given the transcript of questions and answers, evaluate the candidate's performance.
Provide a score between 0-100 and lists of strengths, areas for improvement, and a summary feedback statement.
You MUST respond in valid JSON format matching this structure:
{
  "overallScore": number,
  "strengths": ["string"],
  "areasForImprovement": ["string"],
  "finalThoughts": "string"
}
Only output the JSON object.`;

          const evaluation = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            response_format: { type: "json_object" },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: transcript }
            ],
            temperature: 0.7,
          });

          overallReport = JSON.parse(evaluation.choices[0].message.content);
        } catch (err) {
          console.warn('OpenAI final evaluation failed:', err.message);
        }
      }

      session.overallScore = overallReport.overallScore;
      session.improvementSuggestions = overallReport.areasForImprovement;
      await session.save();

      // Save overall summary message in Chat
      const summaryMsg = `**Interview Completed!**\n\nHere is your overall feedback:\n*   **Score:** ${overallReport.overallScore}/100\n*   **Strengths:**\n    ${overallReport.strengths.map(s => `- ${s}`).join('\n')}\n*   **Areas to Improve:**\n    ${overallReport.areasForImprovement.map(a => `- ${a}`).join('\n')}\n\n*   **Summary:** ${overallReport.finalThoughts}`;
      await Message.create({
        chatId,
        role: 'assistant',
        content: summaryMsg,
      });

      return res.status(200).json({
        isFinished: true,
        feedback: individualFeedback,
        overallReport,
      });
    }
  } catch (error) {
    console.error('Error in submitAnswer:', error);
    res.status(500).json({ message: 'Server error when submitting answer' });
  }
};

// @desc    Get interview session overall feedback details
// @route   GET /api/interview/feedback/:chatId
// @access  Private
export const getInterviewFeedback = async (req, res) => {
  try {
    const { chatId } = req.params;
    const session = await InterviewSession.findOne({ chatId, userId: req.user._id });

    if (!session) {
      return res.status(404).json({ message: 'Interview session not found' });
    }

    res.status(200).json(session);
  } catch (error) {
    console.error('Error in getInterviewFeedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


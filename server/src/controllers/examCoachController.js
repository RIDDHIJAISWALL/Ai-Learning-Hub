import OpenAI from 'openai';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key_to_prevent_crash",
});

// @desc    Generate study plan
// @route   POST /api/exam-coach/plan
// @access  Private
export const generateStudyPlan = async (req, res) => {
  try {
    const { examName, examDate, currentLevel, topics } = req.body;

    if (!examName || !examDate) {
      return res.status(400).json({ message: 'examName and examDate are required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({
        plan: {
          examName,
          examDate,
          weeklyGoals: [
            { week: 1, focus: "Mock Week 1 Focus", tasks: ["Task 1", "Task 2"] },
            { week: 2, focus: "Mock Week 2 Focus", tasks: ["Task 3", "Task 4"] }
          ],
          tips: ["Set an API key to get a real study plan."]
        }
      });
    }

    // Force structured output using OpenAI JSON mode or Tool calling
    const systemPrompt = `You are an AI Exam Preparation Coach. The user is preparing for an exam.
Given the exam name, date, their current level, and topics to cover, generate a structured study plan.
You MUST respond in valid JSON format matching this structure:
{
  "examName": "string",
  "examDate": "string",
  "weeklyGoals": [
    { "week": number, "focus": "string", "tasks": ["string"] }
  ],
  "tips": ["string"]
}
Only output the JSON object.`;

    const userPrompt = `Exam Name: ${examName}\nExam Date: ${examDate}\nCurrent Level: ${currentLevel || 'Beginner'}\nTopics: ${topics || 'General syllabus'}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
    });

    const aiContent = completion.choices[0].message.content;
    const studyPlan = JSON.parse(aiContent);

    res.status(200).json({ plan: studyPlan });
  } catch (error) {
    console.error('Error in generateStudyPlan:', error);
    res.status(500).json({ message: 'Server error when generating study plan' });
  }
};

import dotenv from 'dotenv';
import StudyPlan from '../models/StudyPlan.js';
import { ai } from '../lib/gemini.js';

dotenv.config();

// @desc    Generate and save study plan
// @route   POST /api/exam-coach/plan
// @access  Private
export const generateStudyPlan = async (req, res) => {
  try {
    const { examName, examDate, currentLevel, topics } = req.body;

    if (!examName || !examDate) {
      return res.status(400).json({ message: 'examName and examDate are required' });
    }

    let studyPlanData;

    if (!process.env.GEMINI_API_KEY) {
      // Mock data when API Key is missing
      studyPlanData = {
        examName,
        examDate: new Date(examDate),
        weeklyGoals: [
          {
            week: 1,
            focus: "Foundation & Basic Concepts",
            tasks: [
              { taskText: "Read introductory chapters", isCompleted: false },
              { taskText: "Review standard formulas and shortcuts", isCompleted: false }
            ]
          },
          {
            week: 2,
            focus: "Intermediate Topics & Exercises",
            tasks: [
              { taskText: "Solve chapter exercises", isCompleted: false },
              { taskText: "Take a mini quiz on foundations", isCompleted: false }
            ]
          }
        ],
        tips: ["Set your GEMINI_API_KEY in .env to get customized study plans."]
      };
    } else {
      const systemPrompt = `You are an AI Exam Preparation Coach. The user is preparing for an exam.
Given the exam name, date, their current level, and topics to cover, generate a structured study plan.
You MUST respond in valid JSON format matching this structure:
{
  "weeklyGoals": [
    { "week": number, "focus": "string", "tasks": [{ "taskText": "string" }] }
  ],
  "tips": ["string"]
}
Only output the JSON object, do not include any markdown styling or wrapper.`;

      const userPrompt = `Exam Name: ${examName}\nExam Date: ${examDate}\nCurrent Level: ${currentLevel || 'Beginner'}\nTopics: ${topics || 'General syllabus'}`;

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: "OBJECT",
            properties: {
              weeklyGoals: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    week: { type: "INTEGER" },
                    focus: { type: "STRING" },
                    tasks: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                        properties: {
                          taskText: { type: "STRING" }
                        },
                        required: ["taskText"]
                      }
                    }
                  },
                  required: ["week", "focus", "tasks"]
                }
              },
              tips: { type: "ARRAY", items: { type: "STRING" } }
            },
            required: ["weeklyGoals", "tips"]
          },
          temperature: 0.7,
        }
      });

      const aiContent = response.text;
      const parsedPlan = JSON.parse(aiContent);

      studyPlanData = {
        examName,
        examDate: new Date(examDate),
        weeklyGoals: parsedPlan.weeklyGoals.map(w => ({
          week: w.week,
          focus: w.focus,
          tasks: w.tasks.map(t => ({
            taskText: t.taskText || t,
            isCompleted: false
          }))
        })),
        tips: parsedPlan.tips || []
      };
    }

    // Save to database
    const studyPlan = await StudyPlan.create({
      userId: req.user._id,
      examName: studyPlanData.examName,
      examDate: studyPlanData.examDate,
      weeklyGoals: studyPlanData.weeklyGoals,
      tips: studyPlanData.tips,
      progress: 0
    });

    res.status(201).json(studyPlan);
  } catch (error) {
    console.error('Error in generateStudyPlan:', error);
    res.status(500).json({ message: 'Server error when generating study plan' });
  }
};

// @desc    Get all study plans for a user
// @route   GET /api/exam-coach/plans
// @access  Private
export const getStudyPlans = async (req, res) => {
  try {
    const plans = await StudyPlan.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(plans);
  } catch (error) {
    console.error('Error in getStudyPlans:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update study plan progress/tasks
// @route   PATCH /api/exam-coach/plans/:id
// @access  Private
export const updateStudyPlanProgress = async (req, res) => {
  try {
    const { weeklyGoals } = req.body;
    const plan = await StudyPlan.findOne({ _id: req.params.id, userId: req.user._id });

    if (!plan) {
      return res.status(404).json({ message: 'Study plan not found' });
    }

    if (weeklyGoals) {
      plan.weeklyGoals = weeklyGoals;
    }

    // Recalculate progress percentage
    let totalTasks = 0;
    let completedTasks = 0;

    plan.weeklyGoals.forEach(week => {
      week.tasks.forEach(task => {
        totalTasks++;
        if (task.isCompleted) {
          completedTasks++;
        }
      });
    });

    plan.progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    await plan.save();
    res.status(200).json(plan);
  } catch (error) {
    console.error('Error in updateStudyPlanProgress:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


import dotenv from 'dotenv';
import { ai } from '../lib/gemini.js';

dotenv.config();

// @desc    Analyze code for bugs, complexity, and improvements
// @route   POST /api/coding/review
// @access  Private
export const reviewCode = async (req, res) => {
  try {
    const { code, language, problemDescription } = req.body;

    if (!code || !language) {
      return res.status(400).json({ message: 'code and language are required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        bugs: ["Mock Bug: Ensure proper null/undefined checks.", "Mock Bug: Loop boundary off-by-one."],
        improvements: ["Use const/let instead of var.", "Consider .map() or .filter() for readability."],
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        correctedCode: `// Corrected ${language} code (mock)\nconsole.log("Mock code review");`
      });
    }

    const systemPrompt = `You are an expert AI Coding Coach and static analysis tool.
Analyze the provided code in the ${language} language.
Find bugs, suggest improvements, analyze time/space complexity, and provide corrected code.
You MUST respond in valid JSON format matching this exact structure:
{
  "bugs": ["string"],
  "improvements": ["string"],
  "timeComplexity": "string",
  "spaceComplexity": "string",
  "correctedCode": "string"
}
Only output the JSON object. Do not wrap in markdown blocks.`;

    const userPrompt = `Problem Description (Optional): ${problemDescription || 'Not provided'}\nCode to Review:\n\`\`\`${language}\n${code}\n\`\`\``;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            bugs: { type: 'ARRAY', items: { type: 'STRING' } },
            improvements: { type: 'ARRAY', items: { type: 'STRING' } },
            timeComplexity: { type: 'STRING' },
            spaceComplexity: { type: 'STRING' },
            correctedCode: { type: 'STRING' }
          },
          required: ['bugs', 'improvements', 'timeComplexity', 'spaceComplexity', 'correctedCode']
        },
        temperature: 0.5,
      }
    });

    const review = JSON.parse(response.text);
    res.status(200).json(review);

  } catch (error) {
    console.error('Error in reviewCode:', error);
    res.status(500).json({ message: 'Server error during code analysis' });
  }
};

// @desc    Debug code and find fixes
// @route   POST /api/coding/debug
// @access  Private
export const debugCode = async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ message: 'code and language are required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        bugs: ["Mock: Variable used before declaration.", "Mock: Missing return statement."],
        fixedCode: `// Fixed ${language} code (mock)\nconsole.log("Mock debug");`,
        explanation: "Mock: Set GEMINI_API_KEY for real debugging analysis."
      });
    }

    const systemPrompt = `You are an expert AI Debugger.
Analyze the provided ${language} code, identify all bugs and errors, and provide a fixed version.
You MUST respond in valid JSON format matching this exact structure:
{
  "bugs": ["string"],
  "fixedCode": "string",
  "explanation": "string"
}
Only output the JSON object. Do not wrap in markdown blocks.`;

    const userPrompt = `Debug this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\``;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            bugs: { type: 'ARRAY', items: { type: 'STRING' } },
            fixedCode: { type: 'STRING' },
            explanation: { type: 'STRING' }
          },
          required: ['bugs', 'fixedCode', 'explanation']
        },
        temperature: 0.4,
      }
    });

    const result = JSON.parse(response.text);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in debugCode:', error);
    res.status(500).json({ message: 'Server error during debugging' });
  }
};

// @desc    Explain what the code does
// @route   POST /api/coding/explain
// @access  Private
export const explainCode = async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ message: 'code and language are required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        explanation: "Mock: This code uses standard language constructs. Set GEMINI_API_KEY for real explanation.",
        keyPoints: ["Mock: Uses standard constructs.", "Mock: Follows basic principles."]
      });
    }

    const systemPrompt = `You are an expert programming educator.
Explain clearly what the provided ${language} code does, step by step.
You MUST respond in valid JSON format matching this exact structure:
{
  "explanation": "string",
  "keyPoints": ["string"]
}
Only output the JSON object. Do not wrap in markdown blocks.`;

    const userPrompt = `Explain this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\``;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            explanation: { type: 'STRING' },
            keyPoints: { type: 'ARRAY', items: { type: 'STRING' } }
          },
          required: ['explanation', 'keyPoints']
        },
        temperature: 0.4,
      }
    });

    const result = JSON.parse(response.text);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in explainCode:', error);
    res.status(500).json({ message: 'Server error during explanation' });
  }
};

// @desc    Optimize code for performance and readability
// @route   POST /api/coding/optimize
// @access  Private
export const optimizeCode = async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ message: 'code and language are required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        improvements: ["Mock: Use efficient data structures.", "Mock: Reduce nested loops."],
        improvedCode: `// Optimized ${language} code (mock)\nconsole.log("Mock optimized");`,
        timeComplexity: "O(N log N)",
        spaceComplexity: "O(N)"
      });
    }

    const systemPrompt = `You are an expert software optimization engineer.
Analyze the provided ${language} code and provide an optimized version with clear improvement notes.
You MUST respond in valid JSON format matching this exact structure:
{
  "improvements": ["string"],
  "improvedCode": "string",
  "timeComplexity": "string",
  "spaceComplexity": "string"
}
Only output the JSON object. Do not wrap in markdown blocks.`;

    const userPrompt = `Optimize this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\``;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            improvements: { type: 'ARRAY', items: { type: 'STRING' } },
            improvedCode: { type: 'STRING' },
            timeComplexity: { type: 'STRING' },
            spaceComplexity: { type: 'STRING' }
          },
          required: ['improvements', 'improvedCode', 'timeComplexity', 'spaceComplexity']
        },
        temperature: 0.5,
      }
    });

    const result = JSON.parse(response.text);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in optimizeCode:', error);
    res.status(500).json({ message: 'Server error during optimization' });
  }
};

// @desc    Generate practice questions
// @route   POST /api/coding/practice
// @access  Private
export const generatePracticeQuestion = async (req, res) => {
  try {
    const { topic, language, difficulty } = req.body;

    const selectedTopic = topic || 'Arrays';
    const selectedLanguage = language || 'JavaScript';
    const selectedDifficulty = difficulty || 'Medium';

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        title: "Reverse a Linked List",
        description: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
        difficulty: selectedDifficulty,
        constraints: [
          "The number of nodes in the list is the range [0, 5000].",
          "-5000 <= Node.val <= 5000"
        ],
        starterCode: `var reverseList = function(head) {\n    // Write your code here\n};`,
        hints: [
          "Can you solve it both iteratively and recursively?",
          "For iterative, keep track of prev, curr, and next nodes."
        ]
      });
    }

    const systemPrompt = `You are an expert AI Coding Coach. Generate a technical coding problem on the topic "${selectedTopic}" in "${selectedLanguage}" with difficulty level "${selectedDifficulty}".
You MUST respond in valid JSON format matching this exact structure:
{
  "title": "string",
  "description": "string",
  "difficulty": "Easy" | "Medium" | "Hard",
  "constraints": ["string"],
  "starterCode": "string",
  "hints": ["string"]
}
Only output the JSON object. Do not wrap in markdown blocks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            description: { type: 'STRING' },
            difficulty: { type: 'STRING' },
            constraints: { type: 'ARRAY', items: { type: 'STRING' } },
            starterCode: { type: 'STRING' },
            hints: { type: 'ARRAY', items: { type: 'STRING' } }
          },
          required: ['title', 'description', 'difficulty', 'constraints', 'starterCode', 'hints']
        },
        temperature: 0.8,
      }
    });

    const question = JSON.parse(response.text);
    res.status(200).json(question);
  } catch (error) {
    console.error('Error in generatePracticeQuestion:', error);
    res.status(500).json({ message: 'Server error when generating coding question' });
  }
};

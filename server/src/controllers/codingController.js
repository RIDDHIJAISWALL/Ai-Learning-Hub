import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key_to_prevent_crash",
});

// @desc    Analyze code for bugs, complexity, and improvements
// @route   POST /api/coding/review
// @access  Private
export const reviewCode = async (req, res) => {
  try {
    const { code, language, problemDescription } = req.body;

    if (!code || !language) {
      return res.status(400).json({ message: 'code and language are required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      // Mock code analysis when OpenAI API is not available
      return res.status(200).json({
        review: {
          bugs: [
            "Mock Bug: Ensure proper null/undefined checks are performed before accessing properties.",
            "Mock Bug: Loop boundary might cause off-by-one under heavy constraints."
          ],
          improvements: [
            "Use const/let instead of var for proper block scoping.",
            "Consider using array helper methods like .map() or .filter() to improve readability."
          ],
          timeComplexity: "O(N)",
          spaceComplexity: "O(1)",
          correctedCode: `// Corrected ${language} code mock\n\nconsole.log("Mock code review");`
        }
      });
    }

    const systemPrompt = `You are an expert AI Coding Coach and static analysis tool. 
Analyze the provided code in the ${language} language. 
Analyze time/space complexity, find any bugs, and suggest code cleanliness and performance improvements.
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
    });

    const aiContent = completion.choices[0].message.content;
    const review = JSON.parse(aiContent);

    res.status(200).json({ review });
  } catch (error) {
    console.error('Error in reviewCode:', error);
    res.status(500).json({ message: 'Server error during code analysis' });
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

    if (!process.env.OPENAI_API_KEY) {
      // Mock coding question when OpenAI API is not available
      return res.status(200).json({
        question: {
          title: "Reverse a Linked List",
          description: `Given the head of a singly linked list, reverse the list, and return the reversed list.`,
          difficulty: selectedDifficulty,
          constraints: [
            "The number of nodes in the list is the range [0, 5000].",
            "-5000 <= Node.val <= 5000"
          ],
          starterCode: `/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nvar reverseList = function(head) {\n    // Write your code here\n};`,
          hints: [
            "Can you solve it both iteratively and recursively?",
            "For iterative, keep track of prev, curr, and next nodes."
          ]
        }
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: systemPrompt }
      ],
      temperature: 0.8,
    });

    const aiContent = completion.choices[0].message.content;
    const question = JSON.parse(aiContent);

    res.status(200).json({ question });
  } catch (error) {
    console.error('Error in generatePracticeQuestion:', error);
    res.status(500).json({ message: 'Server error when generating coding question' });
  }
};

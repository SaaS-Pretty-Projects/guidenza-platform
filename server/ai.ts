import { db } from './firebase.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GenerateQuizParams {
  moduleTitle: string;
  moduleContent: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
}

interface QuizQuestion {
  questionText: string;
  options: string[];
  correctAnswer: number;
}

interface GenerateQuizResult {
  title: string;
  passingScore: number;
  questions: QuizQuestion[];
}

function buildQuizPrompt(params: GenerateQuizParams): string {
  const difficultyGuide = {
    easy: 'Questions should test basic recall. Each question has 3 answer options. Keep language simple.',
    medium: 'Questions should test understanding and application. Each question has 4 answer options. Include some conceptual questions.',
    hard: 'Questions should test analysis and synthesis. Each question has 4 answer options. Include scenario-based and multi-concept questions.',
  };

  return `You are a course quiz generator. Generate a quiz for a module titled "${params.moduleTitle}" based on the following content:

${params.moduleContent}

Difficulty: ${params.difficulty}
${difficultyGuide[params.difficulty]}
Number of questions: ${params.questionCount}

Return ONLY valid JSON with this exact structure (no markdown, no backticks):
{
  "title": "Quiz: ${params.moduleTitle}",
  "passingScore": 70,
  "questions": [
    {
      "questionText": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0
    }
  ]
}

The correctAnswer is the 0-based index of the correct option. Make sure the correct answer is actually correct based on the content provided.`;
}

function buildTutorPrompt(moduleTitle: string, moduleContent: string, question: string): string {
  return `You are a helpful course tutor for a module titled "${moduleTitle}". 

Here is the module content you are tutoring about:
---
${moduleContent}
---

The student asks: "${question}"

Provide a helpful, clear explanation referencing the module content. If the question is outside the module scope, politely guide them back. Keep your answer concise (under 3 paragraphs).`;
}

function buildSummaryPrompt(moduleTitle: string, moduleContent: string): string {
  return `Summarize the following module titled "${moduleTitle}" in 3-5 bullet points. Each bullet should be a key takeaway. Return ONLY a JSON array of strings.

Module content:
${moduleContent}`;
}

async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return text;
}

function parseJsonResponse(text: string): unknown {
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim();
  return JSON.parse(cleaned);
}

export async function getModuleContent(courseId: string, moduleId: string): Promise<{ title: string; content: string }> {
  const moduleDoc = await db.collection('courses').doc(courseId).collection('modules').doc(moduleId).get();
  if (!moduleDoc.exists) {
    throw new Error('Module not found');
  }
  const data = moduleDoc.data() as Record<string, unknown>;
  const title = (data.title as string) ?? '';
  const content = (data.content as string) ?? (data.description as string) ?? '';
  return { title, content };
}

export async function generateAQuiz(params: GenerateQuizParams): Promise<GenerateQuizResult> {
  const prompt = buildQuizPrompt(params);
  const raw = await callGemini(prompt);
  return parseJsonResponse(raw) as GenerateQuizResult;
}

export async function askTutor(moduleTitle: string, moduleContent: string, question: string): Promise<string> {
  const prompt = buildTutorPrompt(moduleTitle, moduleContent, question);
  return callGemini(prompt);
}

export async function generateSummary(moduleTitle: string, moduleContent: string): Promise<string[]> {
  const prompt = buildSummaryPrompt(moduleTitle, moduleContent);
  const raw = await callGemini(prompt);
  const result = parseJsonResponse(raw);
  if (Array.isArray(result)) {
    return result as string[];
  }
  if (typeof result === 'object' && result !== null) {
    const arr = (result as Record<string, unknown>).summary ?? (result as Record<string, unknown>).bullets ?? (result as Record<string, unknown>).keyTakeaways;
    if (Array.isArray(arr)) return arr as string[];
  }
  return [raw];
}

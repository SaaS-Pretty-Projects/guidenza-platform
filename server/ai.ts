import { db } from './firebase.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Input sanitization for prompt injection prevention
function sanitizeForPrompt(input: string, maxLen = 50000): string {
  if (!input) return '';
  let s = String(input).slice(0, maxLen);
  // Escape backticks and quotes that could break prompt structure
  s = s.replace(/`/g, '\\`').replace(/\$/g, '\\$');
  // Limit newlines to prevent prompt stuffing
  s = s.replace(/\n{3,}/g, '\n\n');
  return s;
}

function sanitizeQuestion(input: string, maxLen = 2000): string {
  if (!input) return '';
  let s = String(input).slice(0, maxLen);
  s = s.replace(/`/g, '\\`').replace(/\$/g, '\\$');
  s = s.replace(/["']/g, '');
  return s;
}

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

  const safeTitle = sanitizeForPrompt(params.moduleTitle, 200);
  const safeContent = sanitizeForPrompt(params.moduleContent, 30000);

  return `You are a course quiz generator. Generate a quiz for a module titled "${safeTitle}" based on the following content:

${safeContent}

Difficulty: ${params.difficulty}
${difficultyGuide[params.difficulty]}
Number of questions: ${params.questionCount}

Return ONLY valid JSON with this exact structure (no markdown, no backticks):
{
  "title": "Quiz: ${safeTitle}",
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
  const safeTitle = sanitizeForPrompt(moduleTitle, 200);
  const safeContent = sanitizeForPrompt(moduleContent, 30000);
  const safeQuestion = sanitizeQuestion(question, 2000);

  return `You are a helpful course tutor for a module titled "${safeTitle}".

Here is the module content you are tutoring about:
---
${safeContent}
---

The student asks: "${safeQuestion}"

Provide a helpful, clear explanation referencing the module content. If the question is outside the module scope, politely guide them back. Keep your answer concise (under 3 paragraphs).`;
}

function buildSummaryPrompt(moduleTitle: string, moduleContent: string): string {
  const safeTitle = sanitizeForPrompt(moduleTitle, 200);
  const safeContent = sanitizeForPrompt(moduleContent, 30000);

  return `Summarize the following module titled "${safeTitle}" in 3-5 bullet points. Each bullet should be a key takeaway. Return ONLY a JSON array of strings.

Module content:
${safeContent}`;
}

async function callGemini(prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return text;
}

function parseJsonResponse(text: string): unknown {
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');

  let start = -1;
  let end = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = text.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    start = firstBracket;
    end = text.lastIndexOf(']');
  }

  if (start === -1 || end === -1 || end < start) {
    throw new Error('No valid JSON structure found in response');
  }

  try {
    return JSON.parse(text.substring(start, end + 1));
  } catch (err) {
    throw new Error(`Failed to parse Gemini JSON response: ${err instanceof Error ? err.message : 'unknown error'}`);
  }
}

export async function getModuleContent(courseId: string, moduleId: string): Promise<{ title: string; content: string }> {
  // "general" is a virtual moduleId used by CoursePlayer for course-level AI tutor
  if (moduleId === 'general') {
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      throw new Error('Module not found');
    }
    const courseData = courseDoc.data() as Record<string, unknown>;
    const title = (courseData.title as string) ?? '';
    const content = (courseData.description as string) ?? '';
    return { title, content };
  }

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
  const parsed = parseJsonResponse(raw);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid quiz response: not an object');
  }
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.title !== 'string' || typeof obj.passingScore !== 'number' || !Array.isArray(obj.questions)) {
    throw new Error('Invalid quiz response: missing required fields');
  }
  for (const q of obj.questions) {
    if (!q || typeof q !== 'object') throw new Error('Invalid question in quiz response');
    const question = q as Record<string, unknown>;
    if (typeof question.questionText !== 'string' || !Array.isArray(question.options) || typeof question.correctAnswer !== 'number') {
      throw new Error('Invalid question structure in quiz response');
    }
  }

  return parsed as GenerateQuizResult;
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

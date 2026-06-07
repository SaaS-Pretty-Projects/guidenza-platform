import { auth } from './firebase';

const AI_API_BASE = `${import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'}/ai`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await auth.currentUser?.getIdToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GeneratedQuiz {
  title: string;
  passingScore: number;
  questions: {
    questionText: string;
    options: string[];
    correctAnswer: number;
  }[];
}

export async function generateQuiz(
  courseId: string,
  moduleId: string,
  difficulty: Difficulty = 'medium',
  questionCount: number = 5,
): Promise<GeneratedQuiz> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${AI_API_BASE}/generate-quiz`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ courseId, moduleId, difficulty, questionCount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? 'Failed to generate quiz');
  }
  return res.json();
}

export async function askTutor(
  courseId: string,
  moduleId: string,
  question: string,
): Promise<string> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${AI_API_BASE}/tutor`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ courseId, moduleId, question }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? 'Failed to get tutor response');
  }
  const data = await res.json();
  return data.answer;
}

export async function getModuleSummary(
  courseId: string,
  moduleId: string,
): Promise<{ summary: string[]; moduleTitle: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${AI_API_BASE}/summarize/${courseId}/${moduleId}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? 'Failed to get summary');
  }
  return res.json();
}

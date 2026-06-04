const AI_API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/ai';

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
  const res = await fetch(`${AI_API_BASE}/generate-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId, moduleId, difficulty, questionCount }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Failed to generate quiz');
  }
  return res.json();
}

export async function askTutor(
  courseId: string,
  moduleId: string,
  question: string,
): Promise<string> {
  const res = await fetch(`${AI_API_BASE}/tutor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId, moduleId, question }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Failed to get tutor response');
  }
  const data = await res.json();
  return data.answer;
}

export async function getModuleSummary(
  courseId: string,
  moduleId: string,
): Promise<{ summary: string[]; moduleTitle: string }> {
  const res = await fetch(`${AI_API_BASE}/summarize/${courseId}/${moduleId}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Failed to get summary');
  }
  return res.json();
}

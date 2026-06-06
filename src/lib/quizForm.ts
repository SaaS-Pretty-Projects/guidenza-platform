import type { GeneratedQuiz } from './ai';

export interface QuizFormQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
}

export interface QuizFormState {
  title: string;
  questions: QuizFormQuestion[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ValidationInput {
  title: string;
  questions: { questionText: string; options: string[]; correctAnswer: number }[];
}

export function validateQuizForm(input: ValidationInput): ValidationResult {
  const errors: string[] = [];

  if (!input.title.trim()) {
    errors.push('Title is required');
  }

  if (input.questions.length === 0) {
    errors.push('At least one question is required');
  }

  input.questions.forEach((q, i) => {
    const label = `Q${i + 1}`;
    if (!q.questionText.trim()) {
      errors.push(`${label}: question text is required`);
    }
    if (q.options.length < 2) {
      errors.push(`${label}: must have at least 2 options`);
    }
    if (q.options.some((o) => !o.trim())) {
      errors.push(`${label}: every option must have text`);
    }
    if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
      errors.push(`${label}: correct answer index is out of range`);
    }
  });

  return { valid: errors.length === 0, errors };
}

export interface MapAIResult {
  title: string;
  passingScore: number;
  questions: QuizFormQuestion[];
}

export function mapAIGeneratedToForm(generated: GeneratedQuiz): MapAIResult {
  return {
    title: generated.title,
    passingScore: generated.passingScore,
    questions: generated.questions.map((q) => ({
      id: crypto.randomUUID(),
      questionText: q.questionText,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
    })),
  };
}

import type { GeneratedQuiz } from './ai';

const generateId = (): string =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15);

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
  passingScore?: number;
  maxAttempts?: number;
}

export function validateQuizForm(input: ValidationInput): ValidationResult {
  const errors: string[] = [];

  if (!input.title.trim()) {
    errors.push('Title is required');
  }

  if (input.questions.length === 0) {
    errors.push('At least one question is required');
  }

  if (input.passingScore !== undefined && (input.passingScore < 1 || input.passingScore > 100)) {
    errors.push('Passing score must be between 1 and 100');
  }

  if (input.maxAttempts !== undefined && input.maxAttempts < 0) {
    errors.push('Max attempts cannot be negative');
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
      id: generateId(),
      questionText: q.questionText,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
    })),
  };
}

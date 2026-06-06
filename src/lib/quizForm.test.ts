import { describe, it, expect } from 'vitest';
import { validateQuizForm, mapAIGeneratedToForm } from './quizForm';
import type { GeneratedQuiz } from './ai';

describe('validateQuizForm', () => {
  it('rejects empty title', () => {
    const result = validateQuizForm({
      title: '   ',
      questions: [
        { questionText: 'Q?', options: ['A', 'B'], correctAnswer: 0 },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Title is required');
  });

  it('rejects question with empty text', () => {
    const result = validateQuizForm({
      title: 'My Quiz',
      questions: [
        { questionText: '  ', options: ['A', 'B'], correctAnswer: 0 },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Q1'))).toBe(true);
  });

  it('rejects question with fewer than 2 options', () => {
    const result = validateQuizForm({
      title: 'My Quiz',
      questions: [
        { questionText: 'Q?', options: ['A'], correctAnswer: 0 },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('2 options'))).toBe(true);
  });

  it('rejects question with empty option text', () => {
    const result = validateQuizForm({
      title: 'My Quiz',
      questions: [
        { questionText: 'Q?', options: ['A', '  '], correctAnswer: 0 },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('option'))).toBe(true);
  });

  it('rejects correctAnswer that is out of range', () => {
    const result = validateQuizForm({
      title: 'My Quiz',
      questions: [
        { questionText: 'Q?', options: ['A', 'B'], correctAnswer: 5 },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('correct answer'))).toBe(true);
  });

  it('accepts a valid quiz with multiple questions and options', () => {
    const result = validateQuizForm({
      title: 'My Quiz',
      questions: [
        { questionText: 'Q1?', options: ['A', 'B', 'C'], correctAnswer: 1 },
        { questionText: 'Q2?', options: ['Yes', 'No'], correctAnswer: 0 },
      ],
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects when there are no questions', () => {
    const result = validateQuizForm({
      title: 'My Quiz',
      questions: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least one question is required');
  });
});

describe('mapAIGeneratedToForm', () => {
  it('maps AI-generated title, passing score, and questions into form state', () => {
    const generated: GeneratedQuiz = {
      title: 'Quiz: AI',
      passingScore: 80,
      questions: [
        { questionText: 'Q1?', options: ['A', 'B', 'C'], correctAnswer: 0 },
        { questionText: 'Q2?', options: ['X', 'Y'], correctAnswer: 1 },
      ],
    };

    const result = mapAIGeneratedToForm(generated);

    expect(result.title).toBe('Quiz: AI');
    expect(result.passingScore).toBe(80);
    expect(result.questions).toHaveLength(2);
  });

  it('assigns fresh UUIDs to each mapped question', () => {
    const generated: GeneratedQuiz = {
      title: 'Quiz',
      passingScore: 70,
      questions: [
        { questionText: 'Q1?', options: ['A', 'B'], correctAnswer: 0 },
        { questionText: 'Q2?', options: ['A', 'B'], correctAnswer: 1 },
      ],
    };

    const result = mapAIGeneratedToForm(generated);
    const ids = result.questions.map((q) => q.id);
    expect(ids[0]).toMatch(/^[0-9a-f-]{36}$/i);
    expect(ids[1]).toMatch(/^[0-9a-f-]{36}$/i);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('preserves correctAnswer indices from AI output', () => {
    const generated: GeneratedQuiz = {
      title: 'Quiz',
      passingScore: 70,
      questions: [
        { questionText: 'Q1?', options: ['A', 'B', 'C', 'D'], correctAnswer: 3 },
      ],
    };

    const result = mapAIGeneratedToForm(generated);
    expect(result.questions[0].correctAnswer).toBe(3);
  });

  it('preserves question text and options from AI output', () => {
    const generated: GeneratedQuiz = {
      title: 'Quiz',
      passingScore: 70,
      questions: [
        { questionText: 'What is 2+2?', options: ['3', '4', '5'], correctAnswer: 1 },
      ],
    };

    const result = mapAIGeneratedToForm(generated);
    expect(result.questions[0].questionText).toBe('What is 2+2?');
    expect(result.questions[0].options).toEqual(['3', '4', '5']);
  });
});

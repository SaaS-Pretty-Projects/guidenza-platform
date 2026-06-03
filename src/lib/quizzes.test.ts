import { describe, it, expect } from 'vitest';
import { computeQuizScore, type QuizAnswer } from './quizzes';

describe('computeQuizScore', () => {
  it('counts correct answers', () => {
    const answers: QuizAnswer[] = [
      { questionId: 'q1', selectedAnswer: 0, correct: true },
      { questionId: 'q2', selectedAnswer: 1, correct: false },
      { questionId: 'q3', selectedAnswer: 2, correct: true },
    ];
    expect(computeQuizScore(answers)).toEqual({ correct: 2, total: 3 });
  });

  it('handles all wrong', () => {
    const answers: QuizAnswer[] = [
      { questionId: 'q1', selectedAnswer: 1, correct: false },
    ];
    expect(computeQuizScore(answers)).toEqual({ correct: 0, total: 1 });
  });

  it('handles empty', () => {
    expect(computeQuizScore([])).toEqual({ correct: 0, total: 0 });
  });
});

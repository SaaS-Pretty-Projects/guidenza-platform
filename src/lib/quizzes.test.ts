import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeQuizScore, type QuizAnswer, type QuizQuestion } from './quizzes';

const firebaseMock = vi.hoisted(() => {
  const batchOps: { type: 'delete'; ref: { id: string; path: string } }[] = [];
  const mockBatch = {
    delete: vi.fn((ref: { id: string; path: string }) => {
      batchOps.push({ type: 'delete', ref });
    }),
    commit: vi.fn(async () => undefined),
  };
  return {
    batchOps,
    mockBatch,
    deletedQuizRef: null as { id: string; path: string } | null,
  };
});

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db: unknown, ...segments: string[]) => ({
    id: segments[segments.length - 1],
    path: segments.join('/'),
  })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  collection: vi.fn((_db: unknown, ...segments: string[]) => ({
    id: segments[segments.length - 1],
    path: segments.join('/'),
  })),
  collectionGroup: vi.fn((_db: unknown, name: string) => ({
    id: name,
    path: `collectionGroup(${name})`,
  })),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(),
  Timestamp: class {},
  writeBatch: vi.fn(() => firebaseMock.mockBatch),
  getFirestore: vi.fn(),
  initializeApp: vi.fn(),
}));

import { deleteQuiz } from './quizzes';

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

describe('QuizQuestion explanation field', () => {
  it('preserves an optional explanation on a QuizQuestion object', () => {
    const q: QuizQuestion = {
      id: 'q1',
      questionText: 'What is 2+2?',
      options: ['3', '4', '5'],
      correctAnswer: 1,
      explanation: 'Basic arithmetic: 2+2=4',
    };
    expect(q.explanation).toBe('Basic arithmetic: 2+2=4');
  });
});

describe('deleteQuiz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes only the quiz document (no cross-user cascade)', async () => {
    const { deleteDoc, doc } = await import('firebase/firestore');

    await deleteQuiz('c1', 'm1', 'q1');

    expect(deleteDoc).toHaveBeenCalledTimes(1);
    expect(doc).toHaveBeenCalledWith(
      expect.anything(), 'courses', 'c1', 'modules', 'm1', 'quizzes', 'q1',
    );
  });
});

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

describe('deleteQuiz cascade', () => {
  beforeEach(() => {
    firebaseMock.batchOps.length = 0;
    firebaseMock.mockBatch.delete.mockClear();
    firebaseMock.mockBatch.commit.mockClear();
    vi.clearAllMocks();
  });

  it('deletes the quiz document and all matching attempts in a single batch', async () => {
    const { getDocs, collectionGroup } = await import('firebase/firestore');
    const fakeAttemptRefs = [
      { id: 'a1', path: 'users/u1/quizAttempts/a1' },
      { id: 'a2', path: 'users/u2/quizAttempts/a2' },
      { id: 'a3', path: 'users/u3/quizAttempts/a3' },
    ];
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: fakeAttemptRefs.map((ref) => ({ ref, data: () => ({}), id: ref.id })),
      size: fakeAttemptRefs.length,
      empty: false,
    } as never);

    await deleteQuiz('c1', 'm1', 'q1');

    expect(collectionGroup).toHaveBeenCalled();
    const cgCalls = vi.mocked(collectionGroup).mock.calls;
    expect(cgCalls.some((c) => c[1] === 'quizAttempts')).toBe(true);
    expect(firebaseMock.mockBatch.delete).toHaveBeenCalledTimes(4);
    const deletedPaths = firebaseMock.batchOps.map((op) => op.ref.path);
    expect(deletedPaths).toContain('courses/c1/modules/m1/quizzes/q1');
    expect(deletedPaths).toContain('users/u1/quizAttempts/a1');
    expect(deletedPaths).toContain('users/u2/quizAttempts/a2');
    expect(deletedPaths).toContain('users/u3/quizAttempts/a3');
    expect(firebaseMock.mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it('still commits the batch when there are no attempts to delete', async () => {
    const { getDocs } = await import('firebase/firestore');
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [],
      size: 0,
      empty: true,
    } as never);

    await deleteQuiz('c1', 'm1', 'q1');

    expect(firebaseMock.mockBatch.delete).toHaveBeenCalledTimes(1);
    expect(firebaseMock.mockBatch.commit).toHaveBeenCalledTimes(1);
  });
});

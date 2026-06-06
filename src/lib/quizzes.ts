import {
  doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  collection, collectionGroup, query, where, orderBy, limit, getDocs,
  serverTimestamp, Timestamp, writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Quiz {
  id?: string;
  title: string;
  passingScore: number;
  maxAttempts: number;
  questions: QuizQuestion[];
}

export interface QuizAnswer {
  questionId: string;
  selectedAnswer: number;
  correct: boolean;
}

export interface QuizAttempt {
  id?: string;
  courseId: string;
  moduleId: string;
  quizId: string;
  score: number;
  passed: boolean;
  answers: QuizAnswer[];
  completedAt: Timestamp | null;
}

function quizDocPath(courseId: string, moduleId: string, quizId: string) {
  return doc(db, 'courses', courseId, 'modules', moduleId, 'quizzes', quizId);
}

function quizzesColPath(courseId: string, moduleId: string) {
  return collection(db, 'courses', courseId, 'modules', moduleId, 'quizzes');
}

export async function createQuiz(
  courseId: string,
  moduleId: string,
  quiz: Omit<Quiz, 'id'>,
): Promise<string> {
  const ref = await addDoc(quizzesColPath(courseId, moduleId), quiz);
  return ref.id;
}

export async function updateQuiz(
  courseId: string,
  moduleId: string,
  quizId: string,
  data: Partial<Omit<Quiz, 'id'>>,
): Promise<void> {
  await updateDoc(quizDocPath(courseId, moduleId, quizId), data);
}

export async function deleteQuiz(
  courseId: string,
  moduleId: string,
  quizId: string,
): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(quizDocPath(courseId, moduleId, quizId));

  const attemptsQuery = query(
    collectionGroup(db, 'quizAttempts'),
    where('quizId', '==', quizId),
  );
  const attemptsSnap = await getDocs(attemptsQuery);
  attemptsSnap.docs.forEach((d) => batch.delete(d.ref));

  await batch.commit();
}

export async function getQuiz(
  courseId: string,
  moduleId: string,
  quizId: string,
): Promise<Quiz | null> {
  const snap = await getDoc(quizDocPath(courseId, moduleId, quizId));
  return snap.exists() ? ({ ...snap.data(), id: snap.id } as Quiz) : null;
}

export async function getModuleQuizzes(
  courseId: string,
  moduleId: string,
): Promise<Quiz[]> {
  const snap = await getDocs(
    query(quizzesColPath(courseId, moduleId), orderBy('title')),
  );
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Quiz));
}

/**
 * Submit a quiz attempt. Returns the attempt record.
 * Checks maxAttempts limit.
 */
export async function submitQuizAttempt(
  uid: string,
  courseId: string,
  moduleId: string,
  quizId: string,
  answers: { questionId: string; selectedAnswer: number }[],
): Promise<{ attempt: QuizAttempt; canRetry: boolean }> {
  const quiz = await getQuiz(courseId, moduleId, quizId);
  if (!quiz) throw new Error('Quiz not found');

  const attemptsRef = collection(db, 'users', uid, 'quizAttempts');
  const prevSnap = await getDocs(
    query(attemptsRef, where('quizId', '==', quizId)),
  );
  const prevCount = prevSnap.size;

  if (quiz.maxAttempts > 0 && prevCount >= quiz.maxAttempts) {
    throw new Error('Maximum attempts reached');
  }

  const gradedAnswers: QuizAnswer[] = answers.map((a) => {
    const question = quiz.questions.find((q) => q.id === a.questionId);
    const correct = question ? question.correctAnswer === a.selectedAnswer : false;
    return { questionId: a.questionId, selectedAnswer: a.selectedAnswer, correct };
  });

  const { correct, total } = computeQuizScore(gradedAnswers);
  const score = total > 0 ? Math.round((correct / total) * 100) : 100;
  const passed = score >= quiz.passingScore;

  const attemptRef = await addDoc(attemptsRef, {
    courseId,
    moduleId,
    quizId,
    score,
    passed,
    answers: gradedAnswers,
    completedAt: serverTimestamp(),
  });

  const canRetry = !passed && (quiz.maxAttempts === 0 || prevCount + 1 < quiz.maxAttempts);

  return {
    attempt: {
      courseId,
      moduleId,
      quizId,
      score,
      passed,
      answers: gradedAnswers,
      completedAt: null,
      id: attemptRef.id,
    },
    canRetry,
  };
}

export async function getQuizAttempts(
  uid: string,
  quizId: string,
): Promise<QuizAttempt[]> {
  const snap = await getDocs(
    query(
      collection(db, 'users', uid, 'quizAttempts'),
      where('quizId', '==', quizId),
      orderBy('completedAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as QuizAttempt));
}

export async function hasPassedQuiz(
  uid: string,
  quizId: string,
): Promise<boolean> {
  const snap = await getDocs(
    query(
      collection(db, 'users', uid, 'quizAttempts'),
      where('quizId', '==', quizId),
      where('passed', '==', true),
      limit(1),
    ),
  );
  return !snap.empty;
}

export function computeQuizScore(answers: QuizAnswer[]): { correct: number; total: number } {
  const correct = answers.filter((a) => a.correct).length;
  return { correct, total: answers.length };
}

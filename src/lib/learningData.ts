import {
  doc, getDoc, setDoc, updateDoc, addDoc,
  collection, arrayUnion, increment,
  serverTimestamp, Timestamp, query,
  orderBy, limit, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';

// ── Types ──────────────────────────────────────────────────────────────────

export interface CourseModule {
  id: string;
  title: string;
}

export interface CourseProgress {
  completedModules: string[];
  quizPassedModules: string[];
  totalModules: number;
  lastModuleId: string;
  updatedAt: Timestamp | null;
}

export interface QuizGatedProgress {
  completedModules: string[];
  quizPassedModules: string[];
  fullyCompleteModules: string[];
  totalModules: number;
  isFullyComplete: boolean;
  modulesRemaining: string[];
}

export interface ActivityEvent {
  id: string;
  type: 'module_complete' | 'enrolled' | 'certificate_earned';
  courseId: string;
  courseName: string;
  moduleId?: string;
  moduleName?: string;
  createdAt: { toDate(): Date } | Date;
}

export interface Certificate {
  courseId: string;
  courseName: string;
  issuedAt: Timestamp;
}

// ── Pure helpers (no Firestore dependency — testable) ──────────────────────

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function weekStartISO(): string {
  const d = new Date();
  const dow = d.getUTCDay(); // 0=Sun
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - daysFromMonday));
  return monday.toISOString().split('T')[0];
}

/**
 * Returns 7 dot states for Mon–Sun of the current week.
 * activityDates: ISO date strings e.g. ["2026-05-28"] from the activity log.
 */
export function getWeekDots(
  activityDates: string[],
): Array<'active' | 'today' | 'empty'> {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const dow = now.getUTCDay(); // 0=Sun
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysFromMonday));

  const activeSet = new Set(activityDates);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    const iso = d.toISOString().split('T')[0];
    if (iso > todayStr) return 'empty';
    if (activeSet.has(iso)) return 'active';
    if (iso === todayStr) return 'today';
    return 'empty';
  });
}

/**
 * Computes quiz-gated progress from the raw progress data.
 * A module is "fully complete" when it's in both completedModules and quizPassedModules.
 */
export function computeQuizGatedProgress(
  completedModules: string[],
  quizPassedModules: string[],
  totalModules: number,
): QuizGatedProgress {
  const fullyCompleteModules = completedModules.filter((m) => quizPassedModules.includes(m));
  return {
    completedModules,
    quizPassedModules,
    fullyCompleteModules,
    totalModules,
    isFullyComplete: fullyCompleteModules.length >= totalModules,
    modulesRemaining: Array.from({ length: totalModules }, (_, i) => i).filter(
      (i) => !fullyCompleteModules.includes(String(i)),
    ).map(String),
  };
}

// ── Firestore write helpers ────────────────────────────────────────────────

/**
 * Called when an enrolled user opens CoursePreview.
 * Updates lastActiveDate and streak. Does NOT add time (no work done yet).
 */
export async function recordCourseOpen(uid: string): Promise<void> {
  const today = todayISO();
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const data = snap.data() as Record<string, unknown>;
  const lastActive = (data.lastActiveDate as string) ?? '';
  if (lastActive === today) return;

  const yDate = new Date();
  const yesterdayStr = new Date(Date.UTC(yDate.getUTCFullYear(), yDate.getUTCMonth(), yDate.getUTCDate() - 1)).toISOString().split('T')[0];

  const currentStreak = (data.streakCount as number) ?? 0;
  const newStreak = lastActive === yesterdayStr ? currentStreak + 1 : 1;
  const longestStreak = Math.max((data.longestStreak as number) ?? 0, newStreak);

  await updateDoc(userRef, { lastActiveDate: today, streakCount: newStreak, longestStreak });
}

/**
 * Records a "Mark done" click on a module.
 * Writes progress, adds 1200s (20 min proxy) to time fields, appends activity.
 * Issues a certificate if all modules are complete.
 */
export async function markModuleComplete(
  uid: string,
  courseId: string,
  moduleId: string,
  moduleName: string,
  courseName: string,
  totalModules: number,
): Promise<{ certificateEarned: boolean }> {
  const weekStart = weekStartISO();
  const progressRef = doc(db, 'users', uid, 'progress', courseId);
  const userRef = doc(db, 'users', uid);

  const progressSnap = await getDoc(progressRef);
  const existing: CourseProgress = progressSnap.exists()
    ? (progressSnap.data() as CourseProgress)
    : { completedModules: [], quizPassedModules: [], totalModules, lastModuleId: '', updatedAt: null };

  if (existing.completedModules.includes(moduleId)) {
    return { certificateEarned: false };
  }

  await setDoc(
    progressRef,
    {
      completedModules: arrayUnion(moduleId),
      totalModules,
      lastModuleId: moduleId,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  const userSnap = await getDoc(userRef);
  const userData = userSnap.exists() ? (userSnap.data() as Record<string, unknown>) : {};
  const storedWeekStart = (userData.weeklySecondsUpdatedAt as string) ?? '';

  const timeUpdate: Record<string, unknown> = {
    totalLearningSeconds: increment(1200),
  };
  if (storedWeekStart !== weekStart) {
    timeUpdate.prevWeeklySeconds = (userData.weeklySeconds as number) ?? 0;
    timeUpdate.weeklySeconds = 1200;
    timeUpdate.weeklySecondsUpdatedAt = weekStart;
  } else {
    timeUpdate.weeklySeconds = increment(1200);
  }
  await updateDoc(userRef, timeUpdate);

  await addDoc(collection(db, 'users', uid, 'activity'), {
    type: 'module_complete',
    courseId,
    courseName,
    moduleId,
    moduleName,
    createdAt: serverTimestamp(),
  });

  const newCount = existing.completedModules.length + 1;
  const quizPassed = existing.quizPassedModules ?? [];
  const gated = computeQuizGatedProgress(
    [...existing.completedModules, moduleId],
    quizPassed,
    totalModules,
  );
  if (gated.isFullyComplete) {
    await setDoc(doc(db, 'users', uid, 'certificates', courseId), {
      courseName,
      issuedAt: serverTimestamp(),
    });
    await addDoc(collection(db, 'users', uid, 'activity'), {
      type: 'certificate_earned',
      courseId,
      courseName,
      createdAt: serverTimestamp(),
    });
    return { certificateEarned: true };
  }

  return { certificateEarned: false };
}

/**
 * Called when a user passes a module's quiz.
 * Adds the module to quizPassedModules. If it's the last module and all are
 * both completed AND quiz-passed, issues a certificate.
 */
export async function markQuizPassed(
  uid: string,
  courseId: string,
  moduleId: string,
  courseName: string,
): Promise<{ certificateEarned: boolean }> {
  const progressRef = doc(db, 'users', uid, 'progress', courseId);
  const progressSnap = await getDoc(progressRef);
  const existing: CourseProgress | null = progressSnap.exists()
    ? (progressSnap.data() as CourseProgress)
    : null;

  if (!existing) {
    await setDoc(progressRef, {
      completedModules: [],
      quizPassedModules: [moduleId],
      totalModules: 1,
      lastModuleId: moduleId,
      updatedAt: serverTimestamp(),
    });
    return { certificateEarned: false };
  }

  const currentQuizPassed = existing.quizPassedModules ?? [];
  if (currentQuizPassed.includes(moduleId)) {
    return { certificateEarned: false };
  }

  await setDoc(
    progressRef,
    {
      quizPassedModules: arrayUnion(moduleId),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  const newQuizPassed = [...currentQuizPassed, moduleId];
  const gated = computeQuizGatedProgress(
    existing.completedModules,
    newQuizPassed,
    existing.totalModules,
  );

  if (gated.isFullyComplete) {
    await setDoc(doc(db, 'users', uid, 'certificates', courseId), {
      courseName,
      issuedAt: serverTimestamp(),
    });
    await addDoc(collection(db, 'users', uid, 'activity'), {
      type: 'certificate_earned',
      courseId,
      courseName,
      createdAt: serverTimestamp(),
    });
    return { certificateEarned: true };
  }

  return { certificateEarned: false };
}

/**
 * Enrolls a user in a course and logs an activity event.
 */
export async function enrollInCourse(
  uid: string,
  courseId: string,
  courseName: string,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    enrolledCourses: arrayUnion(courseId),
  }).catch(async (e) => {
    if (e.code === 'not-found') {
      const { setDoc: sd } = await import('firebase/firestore');
      await sd(doc(db, 'users', uid), {
        enrolledCourses: [courseId],
        savedCourses: [],
        wishlist: [],
      });
    } else {
      throw e;
    }
  });

  await addDoc(collection(db, 'users', uid, 'activity'), {
    type: 'enrolled',
    courseId,
    courseName,
    createdAt: serverTimestamp(),
  });
}

// ── Firestore read helpers ──────────────────────────────────────────────────

export async function getProgressForCourse(
  uid: string,
  courseId: string,
): Promise<CourseProgress | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'progress', courseId));
  return snap.exists() ? (snap.data() as CourseProgress) : null;
}

export async function getRecentActivity(uid: string): Promise<ActivityEvent[]> {
  const q = query(
    collection(db, 'users', uid, 'activity'),
    orderBy('createdAt', 'desc'),
    limit(10),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityEvent));
}

export async function getCertificates(uid: string): Promise<Certificate[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'certificates'));
  return snap.docs.map((d) => ({ courseId: d.id, ...d.data() } as Certificate));
}

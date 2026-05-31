import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  getRecentActivity,
  getCertificates,
  ActivityEvent,
  Certificate,
  CourseProgress,
  CourseModule,
} from '../lib/learningData';
import { useAuth } from './useAuth';

export interface CourseWithModules {
  id: string;
  title: string;
  author: string;
  thumbnail: string;
  modules: CourseModule[];
  totalModules: number;
}

export interface InProgressCourse {
  course: CourseWithModules;
  progress: CourseProgress;
}

export interface UserLearningData {
  enrolledCourses: string[];
  totalLearningSeconds: number;
  streakCount: number;
  longestStreak: number;
  weeklySeconds: number;
  prevWeeklySeconds: number;
  lastActiveDate: string;
  weeklySecondsUpdatedAt: string;
}

export interface DashboardData {
  userData: UserLearningData | null;
  inProgress: InProgressCourse[];
  completed: InProgressCourse[];
  activity: ActivityEvent[];
  certificates: Certificate[];
  loading: boolean;
}

const EMPTY: DashboardData = {
  userData: null,
  inProgress: [],
  completed: [],
  activity: [],
  certificates: [],
  loading: true,
};

export function useDashboard(): DashboardData {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<DashboardData>(EMPTY);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setState({ ...EMPTY, loading: false });
      return;
    }

    let cancelled = false;

    const load = async () => {
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const userData = userSnap.exists()
        ? (userSnap.data() as UserLearningData)
        : null;

      const enrolledIds: string[] = userData?.enrolledCourses ?? [];

      const pairs = await Promise.all(
        enrolledIds.map(async (courseId) => {
          const [courseSnap, progressSnap] = await Promise.all([
            getDoc(doc(db, 'courses', courseId)),
            getDoc(doc(db, 'users', user.uid, 'progress', courseId)),
          ]);
          if (!courseSnap.exists()) return null;

          const course = {
            id: courseId,
            ...courseSnap.data(),
          } as CourseWithModules;

          const totalMods = course.modules?.length ?? course.totalModules ?? 8;
          const progress: CourseProgress = progressSnap.exists()
            ? (progressSnap.data() as CourseProgress)
            : {
                completedModules: [],
                totalModules: totalMods,
                lastModuleId: '',
                updatedAt: null,
              };

          return { course: { ...course, totalModules: totalMods }, progress };
        }),
      );

      const validPairs = pairs.filter(Boolean) as InProgressCourse[];
      const inProgress = validPairs.filter(
        (p) =>
          p.progress.completedModules.length > 0 &&
          p.progress.completedModules.length < p.course.totalModules,
      );
      const completed = validPairs.filter(
        (p) => p.progress.completedModules.length >= p.course.totalModules,
      );

      const [activity, certificates] = await Promise.all([
        getRecentActivity(user.uid),
        getCertificates(user.uid),
      ]);

      if (!cancelled) {
        setState({ userData, inProgress, completed, activity, certificates, loading: false });
      }
    };

    load().catch((err) => {
      console.error('Dashboard load error', err);
      if (!cancelled) setState((s) => ({ ...s, loading: false }));
    });

    return () => { cancelled = true; };
  }, [user, authLoading]);

  return state;
}

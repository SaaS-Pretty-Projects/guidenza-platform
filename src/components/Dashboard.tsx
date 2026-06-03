import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCircle, Award, Flame } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDashboard, CourseWithModules } from '../hooks/useDashboard';
import { relativeTime } from '../lib/relativeTime';
import { getWeekDots } from '../lib/learningData';
import { generateCertificatePdf } from '../lib/certificate';
import { fadeUp } from '../lib/animations';
import { CoursePreview } from './CoursePreview';
import { OrderHistory } from './OrderHistory';
import toast from 'react-hot-toast';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { userData, inProgress, completed, activity, certificates, loading } = useDashboard();
  const [previewCourse, setPreviewCourse] = useState<CourseWithModules | null>(null);
  const navigate = useNavigate();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  useEffect(() => {
    if (!authLoading && !loading && !user) {
      toast.error('Sign in to view your dashboard');
      navigate('/');
    }
  }, [authLoading, loading, user, navigate]);

  if (!user) return null;

  const firstName = user.displayName?.split(' ')[0] ?? 'there';
  const totalHours = Math.round((userData?.totalLearningSeconds ?? 0) / 3600);
  const weekHours = ((userData?.weeklySeconds ?? 0) / 3600).toFixed(1);
  const prevWeekHours = (userData?.prevWeeklySeconds ?? 0) / 3600;
  const weekDelta =
    prevWeekHours > 0
      ? Math.round(((Number(weekHours) - prevWeekHours) / prevWeekHours) * 100)
      : null;

  const activityDates = activity.map((a) => {
    const d =
      typeof (a.createdAt as any).toDate === 'function'
        ? (a.createdAt as any).toDate()
        : new Date(a.createdAt as any);
    return d.toISOString().split('T')[0];
  });
  const weekDots = getWeekDots(activityDates);

  const activityDotColor: Record<string, string> = {
    module_complete: 'bg-white/50',
    certificate_earned: 'bg-white/30',
    enrolled: 'bg-white/15',
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 max-w-5xl mx-auto">
      {/* Page header */}
      <motion.div {...fadeUp(0)} className="mb-10">
        <div className="text-xs uppercase tracking-[3px] text-muted-foreground mb-3">
          Your Dashboard
        </div>
        <h1 className="text-4xl md:text-5xl font-medium tracking-[-1px]">
          Good morning,{' '}
          <span className="font-serif italic font-normal">{firstName}</span>
        </h1>
      </motion.div>

      {/* Profile strip */}
      <motion.div
        {...fadeUp(0.05)}
        className="liquid-glass border border-white/5 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-4"
      >
        <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0 border border-white/10">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UserCircle size={28} className="text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base tracking-tight truncate">
            {user.displayName ?? 'Learner'}
          </p>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
          <div className="text-center px-4 py-2 liquid-glass rounded-2xl border border-white/5">
            <p className="text-lg font-semibold">{inProgress.length}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
          <div className="text-center px-4 py-2 liquid-glass rounded-2xl border border-white/5">
            <p className="text-lg font-semibold">{completed.length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="text-center px-4 py-2 liquid-glass rounded-2xl border border-white/5">
            <p className="text-lg font-semibold">{totalHours}h</p>
            <p className="text-xs text-muted-foreground">Total hours</p>
          </div>
        </div>
      </motion.div>

      {/* Streak + Certificates row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Streak card */}
        <motion.div
          {...fadeUp(0.1)}
          className="liquid-glass border border-white/5 rounded-3xl p-6"
        >
          <p className="text-xs uppercase tracking-[3px] text-muted-foreground mb-5">
            Learning Streak
          </p>
          <div className="flex gap-3">
            <div className="flex-1 bg-black/30 rounded-2xl p-4 border border-white/5">
              <div className="flex gap-1.5 mb-3">
                {weekDots.map((state, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`h-2 rounded-sm ${
                        state === 'active'
                          ? 'bg-white/70'
                          : state === 'today'
                          ? 'bg-white/20'
                          : 'bg-white/5'
                      }`}
                    />
                    <span className="text-[9px] text-muted-foreground/40">
                      {WEEKDAYS[i]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-semibold">
                  {userData?.streakCount ?? 0}
                </span>
                <span className="text-sm text-muted-foreground">days</span>
                <Flame size={16} className="text-muted-foreground ml-auto" />
              </div>
            </div>
            <div className="flex-1 bg-black/30 rounded-2xl p-4 border border-white/5">
              <p className="text-xs text-muted-foreground mb-2">This week</p>
              <p className="text-2xl font-semibold">{weekHours}h</p>
              {weekDelta !== null && (
                <p
                  className={`text-xs mt-1 ${
                    weekDelta >= 0 ? 'text-green-400/70' : 'text-red-400/70'
                  }`}
                >
                  {weekDelta >= 0 ? '↑' : '↓'} {Math.abs(weekDelta)}% vs last week
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Certificates card */}
        <motion.div
          {...fadeUp(0.15)}
          className="liquid-glass border border-white/5 rounded-3xl p-6"
        >
          <p className="text-xs uppercase tracking-[3px] text-muted-foreground mb-5">
            Certificates Earned
          </p>
          {certificates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Complete all modules in a course to earn its certificate.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {certificates.map((cert) => (
                <div
                  key={cert.courseId}
                  className="flex items-center gap-3 bg-black/30 rounded-2xl px-4 py-3 border border-white/5"
                >
                  <Award size={18} className="text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cert.courseName}</p>
                    <p className="text-xs text-muted-foreground">
                      {cert.issuedAt?.toDate
                        ? cert.issuedAt.toDate().toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => generateCertificatePdf(user?.displayName ?? 'Student', cert.courseName, cert.issuedAt?.toDate())}
                    className="text-xs text-muted-foreground/50 border border-white/10 rounded-lg px-3 py-1 hover:text-foreground hover:border-white/20 transition-colors flex-shrink-0"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Continue Learning */}
      <motion.div
        {...fadeUp(0.2)}
        className="liquid-glass border border-white/5 rounded-3xl p-6 mb-4"
      >
        <p className="text-xs uppercase tracking-[3px] text-muted-foreground mb-5">
          Continue Learning
        </p>
        {inProgress.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm mb-4">
              No courses in progress yet.
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 bg-foreground text-background rounded-full px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {inProgress.map(({ course, progress }) => {
              const pct = Math.round(
                (progress.completedModules.length / course.totalModules) * 100,
              );
              return (
                <div
                  key={course.id}
                  className="flex items-center gap-4 bg-black/30 rounded-2xl px-4 py-3 border border-white/5"
                >
                  <div className="w-10 h-8 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{course.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white/40 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {progress.completedModules.length}/{course.totalModules} · {pct}%
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewCourse(course)}
                    className="bg-foreground text-background text-xs font-semibold rounded-full px-4 py-2 hover:opacity-90 transition-opacity flex-shrink-0"
                  >
                    Resume
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Activity Feed */}
      <motion.div
        {...fadeUp(0.25)}
        className="liquid-glass border border-white/5 rounded-3xl p-6"
      >
        <p className="text-xs uppercase tracking-[3px] text-muted-foreground mb-5">
          Recent Activity
        </p>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Your activity will appear here as you learn.
          </p>
        ) : (
          <div className="flex flex-col">
            {activity.map((event, i) => {
              const eventDate =
                typeof (event.createdAt as any).toDate === 'function'
                  ? (event.createdAt as any).toDate()
                  : new Date(event.createdAt as any);
              const text =
                event.type === 'module_complete'
                  ? `Completed ${event.moduleName} — ${event.courseName}`
                  : event.type === 'certificate_earned'
                  ? `Earned certificate: ${event.courseName}`
                  : `Enrolled in ${event.courseName}`;

              return (
                <div
                  key={event.id}
                  className={`flex items-start gap-3 py-3 ${
                    i < activity.length - 1 ? 'border-b border-white/5' : ''
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${
                      activityDotColor[event.type] ?? 'bg-white/10'
                    }`}
                  />
                  <p className="flex-1 text-sm text-muted-foreground">{text}</p>
                  <span className="text-xs text-muted-foreground/40 flex-shrink-0">
                    {relativeTime(eventDate)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Order History */}
      <div className="mt-8">
        <OrderHistory />
      </div>

      {/* CoursePreview modal — opened by Resume button */}
      <CoursePreview
        course={previewCourse as any}
        onClose={() => setPreviewCourse(null)}
      />
    </div>
  );
}

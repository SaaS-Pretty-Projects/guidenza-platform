import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface Course {
  id: string;
  title: string;
  description: string;
  author: string;
  price: number;
  thumbnail: string;
  totalModules?: number;
}

export function Dashboard() {
  const { user, loading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) {
      if (!loading) setFetching(false);
      return;
    }

    const fetchSavedCourses = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const savedIds = userData.savedCourses || [];
          
          if (savedIds.length === 0) {
            setCourses([]);
            setFetching(false);
            return;
          }

          // Fetch each course
          const fetchedCourses = [];
          for (const id of savedIds) {
            const courseRef = doc(db, 'courses', id);
            const courseSnap = await getDoc(courseRef);
            if (courseSnap.exists()) {
              fetchedCourses.push({ id, ...courseSnap.data() } as Course);
            }
          }
          setCourses(fetchedCourses);
        }
      } catch (err) {
        console.error("Error fetching saved courses", err);
      } finally {
        setFetching(false);
      }
    };

    fetchSavedCourses();
  }, [user, loading]);

  if (loading || fetching) {
    return <div className="min-h-screen pt-32 px-6 flex items-center justify-center text-muted-foreground">Loading dashboard...</div>;
  }

  if (!user) {
    return <div className="min-h-screen pt-32 px-6 flex items-center justify-center text-muted-foreground">Please sign in to view your dashboard.</div>;
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-semibold mb-8 tracking-[-0.5px]">Your Dashboard</h1>
      <p className="text-muted-foreground mb-12 text-lg max-w-2xl">
        Access your saved courses and pick up where you left off.
      </p>

      {courses.length === 0 ? (
        <div className="py-20 text-center liquid-glass rounded-3xl border border-white/5">
          <p className="text-muted-foreground">You haven't saved any courses yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="liquid-glass rounded-3xl border border-white/5 overflow-hidden group">
              <div className="h-48 bg-muted relative">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-medium tracking-tight mb-2 line-clamp-1">{course.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">By {course.author}</p>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Enrolled
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

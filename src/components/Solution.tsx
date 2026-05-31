import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../lib/animations';
import { Compass, MonitorPlay, LayoutTemplate, Scale, CheckCircle2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, limit, query, doc, getDoc } from 'firebase/firestore';
import { CoursePreview } from './CoursePreview';
import { useAuth } from '../contexts/AuthContext';

interface Course {
  id: string;
  title: string;
  description: string;
  author: string;
  price: number;
  thumbnail: string;
  totalModules?: number;
  categories?: string[];
}

export function Solution() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const q = query(collection(db, 'courses'), limit(4));
        const snapshot = await getDocs(q);
        const data: Course[] = [];
        snapshot.forEach(doc => {
          data.push({ id: doc.id, ...doc.data() } as Course);
        });
        setCourses(data);
      } catch (err) {
        console.error("Error fetching courses", err);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchEnrolled = async () => {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          setEnrolledIds(snap.data().savedCourses || []);
        }
      };
      fetchEnrolled();
    } else {
      setEnrolledIds([]);
    }
  }, [user]);

  return (
    <section className="py-20 sm:py-32 md:pt-44 border-t border-border/30 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16 lg:gap-12">
        {/* Left Column - Sticky */}
        <div className="lg:col-span-5">
          <motion.div {...fadeUp(0)} className="lg:sticky lg:top-32">
            <div className="text-xs uppercase tracking-[3px] text-muted-foreground mb-6">
              Value Proposition
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-[-0.5px] sm:tracking-[-1px] mb-6">
              A platform for <span className="font-serif italic font-normal">expert</span> learning
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              We provide the storefront, technical environment, and payment processing while authors provide the knowledge.
            </p>
            <div className="rounded-2xl overflow-hidden aspect-video border border-border/20 bg-muted">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260507_153148_d7a3e1dd-e5d0-4ce6-8306-00d7522ecc44.mp4"
              />
            </div>
          </motion.div>
        </div>

        {/* Right Column - Course Cards */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="text-sm uppercase tracking-[2px] text-muted-foreground mb-2">Featured Courses</div>
          {courses.map((course, i) => {
            const isEnrolled = enrolledIds.includes(course.id);
            return (
              <motion.div
                key={course.id}
                {...fadeUp(i * 0.1)}
                onClick={() => setSelectedCourse(course)}
                className="p-6 md:p-8 rounded-3xl liquid-glass border border-white/5 cursor-pointer hover:bg-white-[0.03] transition-colors group relative"
              >
                {isEnrolled && (
                  <div className="absolute top-4 right-4 bg-green-500/20 text-green-400 border border-green-500/30 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Enrolled
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                  <div className="w-full sm:w-28 md:w-32 h-28 sm:h-32 shrink-0 rounded-xl sm:rounded-2xl overflow-hidden bg-muted">
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between mb-2">
                      <h3 className="text-xl md:text-2xl font-semibold tracking-[-0.5px] group-hover:text-foreground/80 transition-colors">
                        {course.title}
                      </h3>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4">By {course.author}</p>
                    <p className="text-muted-foreground line-clamp-2 text-sm max-w-lg mb-4">
                      {course.description}
                    </p>
                    <div className="font-semibold text-foreground">${course.price}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      <CoursePreview course={selectedCourse} onClose={() => setSelectedCourse(null)} />
    </section>
  );
}

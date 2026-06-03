import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { CoursePreview } from './CoursePreview';
import { Users2, BookOpen } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

interface Course {
  id: string;
  title: string;
  description: string;
  author: string;
  price: number;
  thumbnail: string;
  categories?: string[];
  totalModules?: number;
}

export function InstructorProfile() {
  const { authorName } = useParams<{ authorName: string }>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    const fetchAuthorCourses = async () => {
      if (!authorName) return;
      try {
        const decodedName = decodeURIComponent(authorName);
        const q = query(collection(db, 'courses'), where('author', '==', decodedName));
        const snapshot = await getDocs(q);
        const data: Course[] = [];
        snapshot.forEach(doc => {
          data.push({ id: doc.id, ...doc.data() } as Course);
        });
        setCourses(data);
      } catch (err) {
        console.error("Error fetching author courses", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuthorCourses();
  }, [authorName]);

  if (loading) {
    return <div className="min-h-screen pt-32 px-6 flex items-center justify-center text-muted-foreground">Loading profile...</div>;
  }

  const decodedName = authorName ? decodeURIComponent(authorName) : 'Instructor';
  const totalStudents = courses.length > 0 ? (courses.length * 1530) : 0; // Mock student count
  
  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-5xl mx-auto">
      <Helmet>
        <title>{decodedName} | Instructor at Guidenza</title>
        <meta name="description" content={`Explore courses created by ${decodedName}.`} />
      </Helmet>

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16 liquid-glass p-8 rounded-3xl border border-white/5">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-muted shrink-0">
          <div className="w-full h-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 flex items-center justify-center text-4xl font-light text-foreground">
            {decodedName.charAt(0)}
          </div>
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-4xl font-semibold mb-2 tracking-[-0.5px]">{decodedName}</h1>
          <p className="text-muted-foreground mb-6 text-lg max-w-2xl">
            Passionate educator and industry expert. Dedicated to creating high-quality, practical learning experiences that help professionals advance their careers.
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-6">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Users2 size={18} className="text-muted-foreground" />
              <span><strong>{totalStudents.toLocaleString()}</strong> Students</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <BookOpen size={18} className="text-muted-foreground" />
              <span><strong>{courses.length}</strong> Courses</span>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-8">Courses by {decodedName}</h2>

      {courses.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          No courses found for this instructor.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div 
              key={course.id} 
              onClick={() => setSelectedCourse(course)}
              className="liquid-glass rounded-3xl border border-white/5 overflow-hidden group cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <div className="h-48 bg-muted relative">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  {course.categories?.slice(0, 2).map((cat, i) => (
                    <span key={i} className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/10 bg-white/5">
                      {cat}
                    </span>
                  ))}
                </div>
                <h3 className="text-xl font-medium tracking-tight mb-2 line-clamp-1">{course.title}</h3>
                <div className="font-semibold text-foreground">${course.price}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CoursePreview course={selectedCourse} onClose={() => setSelectedCourse(null)} />
    </div>
  );
}

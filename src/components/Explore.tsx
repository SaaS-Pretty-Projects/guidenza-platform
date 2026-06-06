import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { db } from '../lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { CoursePreview } from './CoursePreview';
import { GridCardSkeleton } from './Skeleton';

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

const CATEGORIES = ["All", "Development", "Business", "React", "Frontend", "Architecture", "Startups", "Data Science", "Python"];

export function Explore() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const q = query(collection(db, 'courses'));
        const snapshot = await getDocs(q);
        const data: Course[] = [];
        snapshot.forEach(doc => {
          data.push({ id: doc.id, ...doc.data() } as Course);
        });
        setCourses(data);
      } catch (err) {
        console.error("Error fetching courses", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filteredCourses = selectedCategory === "All" 
    ? courses 
    : courses.filter(c => c.categories?.includes(selectedCategory));

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="h-10 bg-white/5 rounded-lg w-48 mb-8 animate-pulse" />
        <div className="flex flex-wrap gap-2 mb-12">
          {[0,1,2,3,4].map(i => <div key={i} className="h-9 w-24 rounded-full bg-white/5 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0,1,2,3,4,5].map(i => <GridCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <Helmet>
        <title>Explore Courses | Guidenza</title>
        <meta name="description" content="Browse expert-led courses in development, business, data science, and more. Learn at your own pace with AI-powered tutoring." />
      </Helmet>
      <h1 className="text-4xl font-semibold mb-8 tracking-[-0.5px]">Explore Courses</h1>
      
      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-12">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category 
                ? 'bg-foreground text-background' 
                : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div 
            key={course.id} 
            onClick={() => setSelectedCourse(course)}
            className="liquid-glass rounded-3xl border border-white/5 overflow-hidden group cursor-pointer hover:bg-white-[0.03] transition-colors"
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
              <p className="text-sm text-muted-foreground mb-4">By {course.author}</p>
              <div className="font-semibold text-foreground">${course.price}</div>
            </div>
          </div>
        ))}
        {filteredCourses.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No courses found for this category.
          </div>
        )}
      </div>

      <CoursePreview course={selectedCourse} onClose={() => setSelectedCourse(null)} />
    </div>
  );
}

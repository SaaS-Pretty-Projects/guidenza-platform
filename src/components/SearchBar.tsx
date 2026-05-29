import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { CoursePreview } from './CoursePreview';

interface Course {
  id: string;
  title: string;
  description: string;
  author: string;
  price: number;
  thumbnail: string;
}

export function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if clicking inside the modal
      if (document.getElementById('course-preview-modal')?.contains(e.target as Node)) {
        return;
      }
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setCourses([]);
      return;
    }
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'courses'), limit(50));
        const snapshot = await getDocs(q);
        const allCourses: Course[] = [];
        snapshot.forEach(doc => {
          allCourses.push({ id: doc.id, ...doc.data() } as Course);
        });
        
        const term = search.toLowerCase();
        const filtered = allCourses.filter(c => 
          c.title.toLowerCase().includes(term) || 
          c.author.toLowerCase().includes(term) ||
          c.description.toLowerCase().includes(term)
        );
        setCourses(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchCourses();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full flex items-center justify-center text-foreground hover:bg-white/5 transition-colors"
      >
        <Search size={18} strokeWidth={1.5} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-12 right-0 w-80 lg:w-96 liquid-glass rounded-xl p-4 shadow-xl border border-white/10"
          >
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
              <input 
                type="text" 
                placeholder="Search courses or authors..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-foreground focus:outline-none focus:border-white/20"
                autoFocus
              />
            </div>

            <div className="mt-4 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {loading && <p className="text-xs text-muted-foreground text-center py-4">Searching...</p>}
              {!loading && search && courses.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No results found.</p>
              )}
              {!loading && courses.map(course => (
                <div 
                  key={course.id} 
                  onClick={() => setSelectedCourse(course)}
                  className="p-3 pl-4 hover:bg-white/5 rounded-lg cursor-pointer transition-colors mb-1 flex items-center gap-3"
                >
                  <img src={course.thumbnail} alt="" className="w-10 h-10 rounded-md object-cover bg-muted shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-foreground line-clamp-1">{course.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">By {course.author} • ${course.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div id="course-preview-modal">
        <CoursePreview course={selectedCourse} onClose={() => setSelectedCourse(null)} />
      </div>
    </div>
  );
}

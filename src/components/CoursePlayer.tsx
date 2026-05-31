import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { CheckCircle2, Circle, PlayCircle, BookOpen, Clock, ChevronDown, ChevronRight, Award } from 'lucide-react';
import { AITutor } from './AITutor';
import { AIQuiz } from './AIQuiz';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { jsPDF } from 'jspdf';

interface Module {
  id: number;
  title: string;
  duration: string;
  lessons: { id: number; title: string; duration: string }[];
}

interface CoursePlayerProps {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  totalModules: number;
  author: string;
}

function generateModules(totalModules: number, courseTitle: string): Module[] {
  const topics = [
    'Introduction & Setup', 'Core Fundamentals', 'Building Blocks', 'Data Management',
    'Advanced Patterns', 'State Architecture', 'Performance', 'Testing Strategies',
    'Deployment', 'Real-World Project', 'Best Practices', 'Capstone'
  ];
  return Array.from({ length: totalModules }, (_, i) => ({
    id: i + 1,
    title: topics[i % topics.length] || `Module ${i + 1}`,
    duration: `${Math.floor(Math.random() * 30) + 15} min`,
    lessons: Array.from({ length: Math.floor(Math.random() * 3) + 2 }, (_, j) => ({
      id: j + 1,
      title: `Lesson ${j + 1}`,
      duration: `${Math.floor(Math.random() * 10) + 5} min`,
    }))
  }));
}

export function CoursePlayer({ courseId, courseTitle, courseDescription, totalModules, author }: CoursePlayerProps) {
  const { user } = useAuth();
  const [completedModules, setCompletedModules] = useState<number[]>([]);
  const [expandedModule, setExpandedModule] = useState<number | null>(1);
  const [showTutor, setShowTutor] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const modules = generateModules(totalModules, courseTitle);

  useEffect(() => {
    if (!user) return;
    const fetchProgress = async () => {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        const progress = data.moduleProgress?.[courseId] || [];
        setCompletedModules(progress);
      }
    };
    fetchProgress();
  }, [user, courseId]);

  const toggleModuleComplete = async (moduleId: number) => {
    if (!user) return;
    const newCompleted = completedModules.includes(moduleId)
      ? completedModules.filter(id => id !== moduleId)
      : [...completedModules, moduleId];

    setCompletedModules(newCompleted);
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      [`moduleProgress.${courseId}`]: newCompleted,
      [`progress.${courseId}`]: newCompleted.length
    });

    if (newCompleted.length === totalModules && !completedModules.includes(moduleId)) {
      toast.success('Course completed! You can now generate your certificate.');
    }
  };

  const generateCertificate = () => {
    if (completedModules.length < totalModules) {
      toast.error('Complete all modules to earn your certificate');
      return;
    }
    const pdf = new jsPDF({ orientation: 'landscape' });
    pdf.setFillColor(15, 15, 20);
    pdf.rect(0, 0, 297, 210, 'F');

    pdf.setDrawColor(200, 170, 100);
    pdf.setLineWidth(2);
    pdf.rect(10, 10, 277, 190);

    pdf.setTextColor(200, 170, 100);
    pdf.setFontSize(14);
    pdf.text('CERTIFICATE OF COMPLETION', 148.5, 40, { align: 'center' });

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(28);
    pdf.text(courseTitle, 148.5, 70, { align: 'center' });

    pdf.setFontSize(14);
    pdf.setTextColor(180, 180, 180);
    pdf.text('This certifies that', 148.5, 95, { align: 'center' });

    pdf.setFontSize(22);
    pdf.setTextColor(255, 255, 255);
    pdf.text(user?.displayName || 'Student', 148.5, 115, { align: 'center' });

    pdf.setFontSize(12);
    pdf.setTextColor(180, 180, 180);
    pdf.text(`has successfully completed all ${totalModules} modules`, 148.5, 135, { align: 'center' });
    pdf.text(`Instructor: ${author}`, 148.5, 150, { align: 'center' });
    pdf.text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 148.5, 165, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    pdf.text('Guidenza Platform | guidenza.com', 148.5, 185, { align: 'center' });

    pdf.save(`${courseTitle.replace(/\s+/g, '-')}-certificate.pdf`);
    toast.success('Certificate downloaded!');
  };

  const progress = totalModules > 0 ? (completedModules.length / totalModules) * 100 : 0;

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
      <Helmet><title>{courseTitle} | Guidenza</title></Helmet>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">{courseTitle}</h1>
        <p className="text-sm text-muted-foreground">By {author} &bull; {totalModules} modules</p>

        {/* Progress Bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-sm font-medium text-accent">{Math.round(progress)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module List */}
        <div className="lg:col-span-2 space-y-2">
          {modules.map((mod) => (
            <div key={mod.id} className="liquid-glass rounded-xl border border-white/5 overflow-hidden">
              <button
                onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); toggleModuleComplete(mod.id); }}
                  className="shrink-0"
                >
                  {completedModules.includes(mod.id) ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-medium ${completedModules.includes(mod.id) ? 'line-through text-muted-foreground' : ''}`}>
                    {mod.title}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{mod.duration}</span>
                {expandedModule === mod.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {expandedModule === mod.id && (
                <div className="px-4 pb-3 pl-12 space-y-1.5">
                  {mod.lessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>{lesson.title}</span>
                      <span className="ml-auto">{lesson.duration}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Certificate */}
          <div className="liquid-glass rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-yellow-400" />
              <h3 className="text-sm font-medium">Certificate</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {completedModules.length === totalModules
                ? 'All modules complete! Download your certificate.'
                : `Complete ${totalModules - completedModules.length} more modules to earn your certificate.`}
            </p>
            <button
              onClick={generateCertificate}
              disabled={completedModules.length < totalModules}
              className="w-full py-2 rounded-full bg-yellow-400/10 text-yellow-400 text-xs font-medium hover:bg-yellow-400/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Download Certificate
            </button>
          </div>

          {/* AI Tools */}
          <div className="liquid-glass rounded-xl border border-white/5 p-4 space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent" /> AI Tools
            </h3>
            <button
              onClick={() => setShowTutor(true)}
              className="w-full py-2 rounded-full bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition"
            >
              Open AI Tutor
            </button>
            <button
              onClick={() => setShowQuiz(!showQuiz)}
              className="w-full py-2 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium hover:bg-purple-500/20 transition"
            >
              Take AI Quiz
            </button>
          </div>

          {showQuiz && <AIQuiz courseTitle={courseTitle} courseDescription={courseDescription} />}
        </div>
      </div>

      <AITutor
        courseTitle={courseTitle}
        courseDescription={courseDescription}
        isOpen={showTutor}
        onClose={() => setShowTutor(false)}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Plus, Edit2, Users, DollarSign, BookOpen, Info, MessageSquare, HelpCircle, TrendingUp, TrendingDown, Star, Search, ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { QuizEditor } from './QuizEditor';

interface Course {
  id: string;
  title: string;
  description: string;
  author: string;
  price: number;
  thumbnail: string;
  categories?: string[];
  totalModules?: number;
  status?: 'Draft' | 'Live' | 'Archived';
}

const MOCK_TREND_DATA = Array.from({ length: 90 }).map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (89 - i));
  const students = Math.floor(Math.random() * 20) + 10 + Math.floor(i / 3) * 2;
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    students: students,
    revenue: students * 85
  };
});

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#18181b] border border-white/10 rounded-lg p-3 shadow-xl min-w-[140px]">
        <p className="text-muted-foreground text-xs mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm font-medium flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Students:</span>
            <span>{data.students}</span>
          </p>
          <p className="text-sm font-medium flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Revenue:</span>
            <span className="text-green-400">${data.revenue.toLocaleString()}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function InstructorDashboard() {
  const { user, loading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [fetching, setFetching] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementCourse, setAnnouncementCourse] = useState<Course | null>(null);
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    thumbnail: '',
    categories: '',
    totalModules: 12
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<'title' | 'price' | 'studentCount' | 'revenue'>('revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [trendRange, setTrendRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);
  const [quizManagerCourse, setQuizManagerCourse] = useState<{ id: string; title: string; modules?: { id: string; title: string }[] } | null>(null);

  useEffect(() => {
    if (!user) {
      if (!loading) setFetching(false);
      return;
    }

    const fetchInstructorCourses = async () => {
      try {
        const q = query(collection(db, 'courses'), where('author', '==', user.displayName || 'Anonymous'));
        const snapshot = await getDocs(q);
        const data: Course[] = [];
        snapshot.forEach(doc => {
          data.push({ id: doc.id, ...doc.data() } as Course);
        });
        setCourses(data);
      } catch (err) {
        console.error("Error fetching instructor courses", err);
      } finally {
        setFetching(false);
      }
    };

    fetchInstructorCourses();
  }, [user, loading]);

  const handleOpenModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        title: course.title,
        description: course.description,
        price: course.price,
        thumbnail: course.thumbnail || '',
        categories: course.categories?.join(', ') || '',
        totalModules: course.totalModules || 12
      });
    } else {
      setEditingCourse(null);
      setFormData({
        title: '',
        description: '',
        price: 0,
        thumbnail: '',
        categories: '',
        totalModules: 12
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    
    const categoriesArray = formData.categories.split(',').map(c => c.trim()).filter(Boolean);
    const courseData = {
      title: formData.title,
      description: formData.description,
      authorId: user.uid,
      author: user.displayName || 'Anonymous',
      instructorId: user.uid,
      price: Number(formData.price),
      thumbnail: formData.thumbnail,
      categories: categoriesArray,
      totalModules: Number(formData.totalModules)
    };

    try {
      if (editingCourse) {
        const courseRef = doc(db, 'courses', editingCourse.id);
        await updateDoc(courseRef, courseData);
        setCourses(courses.map(c => c.id === editingCourse.id ? { ...courseData, id: c.id } : c));
        toast.success("Course updated successfully!");
      } else {
        const docRef = await addDoc(collection(db, 'courses'), courseData);
        setCourses([...courses, { ...courseData, id: docRef.id }]);
        toast.success("Course published successfully!");
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save course.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !announcementCourse || !announcementMessage.trim()) return;
    setSendingAnnouncement(true);
    
    try {
      await addDoc(collection(db, `courses/${announcementCourse.id}/announcements`), {
        courseId: announcementCourse.id,
        authorId: user.uid,
        message: announcementMessage,
        createdAt: new Date().toISOString()
      });
      toast.success("Announcement sent successfully!");
      setIsAnnouncementModalOpen(false);
      setAnnouncementMessage('');
      setAnnouncementCourse(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send announcement.");
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const handleUpdateStatus = async (courseId: string, status: 'Draft' | 'Live' | 'Archived') => {
    try {
      setUpdatingStatus(courseId);
      const courseRef = doc(db, 'courses', courseId);
      await updateDoc(courseRef, { status });
      setCourses(courses.map(c => c.id === courseId ? { ...c, status } : c));
      toast.success(`Course marked as ${status}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update course status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  const toggleAllCourses = () => {
    if (selectedCourses.length === filteredCourses.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(filteredCourses.map(c => c.id));
    }
  };

  const handleBatchStatusUpdate = async (status: 'Draft' | 'Live' | 'Archived') => {
    if (selectedCourses.length === 0) return;
    try {
      setIsBatchUpdating(true);
      const updates = selectedCourses.map(id => {
        const courseRef = doc(db, 'courses', id);
        return updateDoc(courseRef, { status });
      });
      await Promise.all(updates);
      setCourses(courses.map(c => selectedCourses.includes(c.id) ? { ...c, status } : c));
      toast.success(`${selectedCourses.length} courses marked as ${status}`);
      setSelectedCourses([]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update courses');
    } finally {
      setIsBatchUpdating(false);
    }
  };

  const handleOpenQuizManager = async (courseId: string) => {
    try {
      const snap = await getDoc(doc(db, 'courses', courseId));
      if (snap.exists()) {
        const data = snap.data();
        setQuizManagerCourse({ id: courseId, title: data.title, modules: data.modules ?? [] });
      } else {
        toast.error('Course not found');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load course');
    }
  };

  if (loading || fetching) {
    return <div className="min-h-screen pt-32 px-6 flex items-center justify-center text-muted-foreground">Loading dashboard...</div>;
  }

  if (!user) {
    return <div className="min-h-screen pt-32 px-6 flex items-center justify-center text-muted-foreground">Please sign in to access the instructor dashboard.</div>;
  }

  // Enrich courses with synthetic data for realistic metrics
  const enrichedCourses = courses.map((course, index) => {
    // Generate a pseudorandom student count based on iteration
    const studentCount = 120 + (index * 85) % 400 + (course.price % 10) * 10;
    return {
      ...course,
      studentCount,
      revenue: course.price * studentCount
    };
  });

  const totalStudents = enrichedCourses.reduce((acc, c) => acc + c.studentCount, 0);
  const totalRevenue = enrichedCourses.reduce((acc, c) => acc + c.revenue, 0);

  const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
  const prevMonth1 = new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleString('en-US', { month: 'short' });
  const prevMonth2 = new Date(new Date().setMonth(new Date().getMonth() - 2)).toLocaleString('en-US', { month: 'short' });
  const MOCK_REVENUE_GROWTH = [
    { month: prevMonth2, revenue: Math.round(totalRevenue * 0.6) || 12000 },
    { month: prevMonth1, revenue: Math.round(totalRevenue * 0.8) || 15500 },
    { month: currentMonth, revenue: totalRevenue > 0 ? totalRevenue : 18000 }
  ];

  // Top Performing Highlights
  const topEnrolledCourse = enrichedCourses.length > 0 
    ? enrichedCourses.reduce((prev, current) => (prev.studentCount > current.studentCount) ? prev : current) 
    : null;
  const topGrossingCourse = enrichedCourses.length > 0 
    ? enrichedCourses.reduce((prev, current) => (prev.revenue > current.revenue) ? prev : current) 
    : null;

  // Calculate mock growth from trend data (current 15 days vs previous 15 days)
  const previousPeriodStudents = MOCK_TREND_DATA.slice(0, 15).reduce((acc, curr) => acc + curr.students, 0);
  const currentPeriodStudents = MOCK_TREND_DATA.slice(15, 30).reduce((acc, curr) => acc + curr.students, 0);
  const growthPercentage = previousPeriodStudents === 0 ? 0 : Math.round(((currentPeriodStudents - previousPeriodStudents) / previousPeriodStudents) * 100);

  const filteredCourses = enrichedCourses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (column: 'title' | 'price' | 'studentCount' | 'revenue') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'title' ? 'asc' : 'desc');
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <Helmet>
        <title>Instructor Dashboard | Guidenza</title>
        <meta name="description" content="Manage your courses, view student enrollment, and track your revenue." />
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
          <h1 className="text-4xl font-semibold mb-2 tracking-[-0.5px]">Instructor Dashboard</h1>
          <p className="text-muted-foreground text-lg">Manage your courses and view performance metrics.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-foreground text-background font-semibold px-6 py-3 rounded-full flex items-center gap-2 hover:scale-[1.02] transition-transform"
        >
          <Plus size={18} />
          Create New Course
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="liquid-glass p-6 rounded-3xl border border-white/5"
        >
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <BookOpen size={20} />
            <span className="font-medium">Total Courses</span>
          </div>
          <div className="text-4xl font-semibold">{courses.length}</div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="liquid-glass p-6 rounded-3xl border border-white/5"
        >
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <Users size={20} />
            <span className="font-medium">Total Students</span>
          </div>
          <div className="flex items-end gap-3">
            <div className="text-4xl font-semibold">{totalStudents.toLocaleString()}</div>
            {totalStudents > 0 && (
              <div className={`flex items-center gap-1 text-sm font-medium mb-1 ${growthPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {growthPercentage >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{Math.abs(growthPercentage)}% mo/mo</span>
              </div>
            )}
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="liquid-glass p-6 rounded-3xl border border-white/5"
        >
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <CheckCircle size={20} />
            <span className="font-medium">Completion Rate</span>
          </div>
          <div className="flex items-end gap-3">
            <div className="text-4xl font-semibold">68%</div>
            <div className="flex items-center gap-1 text-sm font-medium mb-1 text-green-400">
              <TrendingUp size={16} />
              <span>+4%</span>
            </div>
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="liquid-glass p-6 rounded-3xl border border-white/5"
        >
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <DollarSign size={20} />
            <span className="font-medium">Total Revenue</span>
            <div className="relative group flex items-center">
              <Info size={16} className="text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-help" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-black/90 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center border border-white/10 pointer-events-none">
                Total revenue = Sum of (Course Price × Enrolled Students) for each course.
              </div>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <div className="text-4xl font-semibold">${totalRevenue.toLocaleString()}</div>
            {totalRevenue > 0 && (
              <div className={`flex items-center gap-1 text-sm font-medium mb-1 ${growthPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {growthPercentage >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{Math.abs(growthPercentage)}% mo/mo</span>
              </div>
            )}
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="liquid-glass p-6 rounded-3xl border border-white/5"
        >
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <TrendingUp size={20} />
            <span className="font-medium">Revenue Growth</span>
          </div>
          <div className="h-20 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_REVENUE_GROWTH} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} 
                  itemStyle={{ color: '#4ade80' }} 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                  labelStyle={{ color: '#a1a1aa', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" fill="#4ade80" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Top Performing */}
      {enrichedCourses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="liquid-glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users size={64} />
            </div>
            <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
              <Star size={16} className="text-yellow-500 fill-yellow-500/20" /> Most Enrolled Course
            </div>
            <h3 className="text-xl font-semibold mb-4 leading-tight">{topEnrolledCourse?.title}</h3>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold">{topEnrolledCourse?.studentCount}</div>
              <div className="text-muted-foreground mb-1">students</div>
            </div>
          </div>
          <div className="liquid-glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign size={64} />
            </div>
            <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
              <Star size={16} className="text-yellow-500 fill-yellow-500/20" /> Highest Revenue Course
            </div>
            <h3 className="text-xl font-semibold mb-4 leading-tight">{topGrossingCourse?.title}</h3>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold text-green-400">${topGrossingCourse?.revenue.toLocaleString()}</div>
              <div className="text-muted-foreground mb-1">total</div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-12 liquid-glass p-6 rounded-3xl border border-white/5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold">Enrollment Trends</h2>
          <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
            <button 
              onClick={() => setTrendRange('7d')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${trendRange === '7d' ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              7 Days
            </button>
            <button 
              onClick={() => setTrendRange('30d')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${trendRange === '30d' ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              30 Days
            </button>
            <button 
              onClick={() => setTrendRange('90d')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${trendRange === '90d' ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              90 Days
            </button>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MOCK_TREND_DATA.slice(-(trendRange === '7d' ? 7 : trendRange === '30d' ? 30 : 90))} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="students" stroke="#ffffff" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#000', stroke: '#fff', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {enrichedCourses.length > 0 && (
        <div className="mb-12 liquid-glass p-6 rounded-3xl border border-white/5 overflow-x-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <h2 className="text-xl font-semibold">Revenue Breakdown</h2>
              {selectedCourses.length > 0 && (
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                  <span className="text-sm font-medium">{selectedCourses.length} selected</span>
                  <div className="h-4 w-px bg-white/20 mx-1"></div>
                  <button 
                    disabled={isBatchUpdating}
                    onClick={() => handleBatchStatusUpdate('Live')}
                    className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                  >
                    Set Live
                  </button>
                  <button 
                    disabled={isBatchUpdating}
                    onClick={() => handleBatchStatusUpdate('Draft')}
                    className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
                  >
                    Set Draft
                  </button>
                  <button 
                    disabled={isBatchUpdating}
                    onClick={() => handleBatchStatusUpdate('Archived')}
                    className="text-xs px-2 py-1 rounded bg-zinc-500/20 text-zinc-400 hover:bg-zinc-500/30 transition-colors disabled:opacity-50"
                  >
                    Archive
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
          </div>
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10 text-muted-foreground">
                <th className="pb-4 pl-4 font-medium w-12">
                  <input 
                    type="checkbox" 
                    className="rounded border-white/20 bg-white/5 accent-white cursor-pointer w-4 h-4"
                    checked={selectedCourses.length > 0 && selectedCourses.length === filteredCourses.length}
                    onChange={toggleAllCourses}
                  />
                </th>
                <th className="pb-4 font-medium">
                  <button 
                    onClick={() => handleSort('title')} 
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Course Name
                    {sortColumn === 'title' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </button>
                </th>
                <th className="pb-4 font-medium">
                  <button 
                    onClick={() => handleSort('price')} 
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Price
                    {sortColumn === 'price' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </button>
                </th>
                <th className="pb-4 font-medium">
                  <button 
                    onClick={() => handleSort('studentCount')} 
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Students
                    {sortColumn === 'studentCount' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </button>
                </th>
                <th className="pb-4 font-medium text-right pr-4">
                  <button 
                    onClick={() => handleSort('revenue')} 
                    className="flex items-center gap-1 w-full justify-end hover:text-foreground transition-colors"
                  >
                    Revenue
                    {sortColumn === 'revenue' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCourses.length > 0 ? (
                sortedCourses.map((course) => (
                  <tr key={course.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 pl-4">
                      <input 
                        type="checkbox"
                        className="rounded border-white/20 bg-white/5 accent-white cursor-pointer w-4 h-4"
                        checked={selectedCourses.includes(course.id)}
                        onChange={() => toggleCourseSelection(course.id)}
                      />
                    </td>
                    <td className="py-4 font-medium">
                      <div className="flex items-center gap-2">
                        <span>{course.title}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                          (course.status || 'Live') === 'Live' ? 'bg-green-500/20 text-green-400' :
                          (course.status || 'Live') === 'Draft' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-zinc-500/20 text-zinc-400'
                        }`}>
                          {course.status || 'Live'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4">${course.price}</td>
                    <td className="py-4">{course.studentCount}</td>
                    <td className="py-4 text-right pr-4 font-semibold text-green-400">${course.revenue.toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No courses found matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="text-2xl font-semibold mb-6">Your Courses</h2>

      {enrichedCourses.length === 0 ? (
        <div className="py-20 text-center liquid-glass rounded-3xl border border-white/5">
          <p className="text-muted-foreground mb-4">You haven't created any courses yet.</p>
          <button 
            onClick={() => handleOpenModal()}
            className="text-foreground font-medium underline"
          >
            Create your first course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrichedCourses.map((course) => (
            <div key={course.id} className="liquid-glass rounded-3xl border border-white/5 overflow-hidden group">
              <div className="h-48 bg-muted relative">
                <img src={course.thumbnail || "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800"} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4 z-10 group/dropdown">
                  <div className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 cursor-pointer backdrop-blur-md border shadow-sm transition-colors ${
                    (course.status || 'Live') === 'Live' ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30' :
                    (course.status || 'Live') === 'Draft' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30' :
                    'bg-zinc-500/20 text-zinc-400 border-zinc-500/30 hover:bg-zinc-500/30'
                  }`}>
                    {course.status || 'Live'}
                    {updatingStatus === course.id ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin ml-1 opacity-50" />
                    ) : (
                      <ChevronDown size={12} className="opacity-50 ml-1" />
                    )}
                  </div>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute top-full left-0 mt-2 w-32 bg-[#18181b] border border-white/10 rounded-xl shadow-xl overflow-hidden opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all">
                    {['Live', 'Draft', 'Archived'].map(status => (
                      <button
                        key={status}
                        disabled={updatingStatus === course.id}
                        onClick={() => handleUpdateStatus(course.id, status as any)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors ${(course.status || 'Live') === status ? 'text-white' : 'text-muted-foreground'}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenQuizManager(course.id)}
                    className="w-10 h-10 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10"
                    title="Manage Quizzes"
                  >
                    <HelpCircle size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      setAnnouncementCourse(course);
                      setIsAnnouncementModalOpen(true);
                    }}
                    className="w-10 h-10 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10"
                    title="Send Announcement"
                  >
                    <MessageSquare size={16} />
                  </button>
                  <button 
                    onClick={() => handleOpenModal(course)}
                    className="w-10 h-10 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10"
                    title="Edit Course"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-medium tracking-tight line-clamp-1">{course.title}</h3>
                  <div className="font-semibold text-foreground">${course.price}</div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Users size={14} /> {course.studentCount} Students</span>
                  <span className="flex items-center gap-1"><BookOpen size={14} /> {course.totalModules || 12} Modules</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Earnings & Revenue Share */}
      <div className="mb-12 liquid-glass p-6 rounded-3xl border border-white/5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-semibold">Earnings & Payouts</h2>
            <p className="text-sm text-muted-foreground mt-1">70/30 revenue share &bull; You keep 70% of every enrollment</p>
          </div>
          <button className="px-5 py-2.5 rounded-full bg-green-500/10 text-green-400 font-medium text-sm hover:bg-green-500/20 transition">
            Request Withdrawal
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/3 border border-white/5">
            <p className="text-xs text-muted-foreground mb-1">Total Earned (70%)</p>
            <p className="text-2xl font-semibold text-green-400">${Math.round(totalRevenue * 0.7).toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/3 border border-white/5">
            <p className="text-xs text-muted-foreground mb-1">Available for Withdrawal</p>
            <p className="text-2xl font-semibold">${Math.round(totalRevenue * 0.7 * 0.8).toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/3 border border-white/5">
            <p className="text-xs text-muted-foreground mb-1">Pending (Processing)</p>
            <p className="text-2xl font-semibold text-yellow-400">${Math.round(totalRevenue * 0.7 * 0.2).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl custom-scrollbar">
            <h2 className="text-2xl font-semibold mb-6">{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Title</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-foreground focus:outline-none focus:border-white/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-foreground focus:outline-none focus:border-white/20 min-h-[100px]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Price ($)</label>
                  <input 
                    type="number" 
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-foreground focus:outline-none focus:border-white/20"
                    required
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Total Modules</label>
                  <input 
                    type="number" 
                    value={formData.totalModules}
                    onChange={e => setFormData({...formData, totalModules: Number(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-foreground focus:outline-none focus:border-white/20"
                    required
                    min={1}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Thumbnail URL</label>
                <input 
                  type="url" 
                  value={formData.thumbnail}
                  onChange={e => setFormData({...formData, thumbnail: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-foreground focus:outline-none focus:border-white/20"
                  placeholder="https://images.pexels.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Categories (comma separated)</label>
                <input 
                  type="text" 
                  value={formData.categories}
                  onChange={e => setFormData({...formData, categories: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-foreground focus:outline-none focus:border-white/20"
                  placeholder="React, Business, Frontend"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-full font-semibold border border-white/10 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-6 py-3 rounded-full font-semibold bg-foreground text-background hover:scale-[1.02] transition-transform disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {quizManagerCourse && (
        <QuizEditor
          courseId={quizManagerCourse.id}
          modules={quizManagerCourse.modules ?? []}
          onClose={() => setQuizManagerCourse(null)}
        />
      )}

      {isAnnouncementModalOpen && announcementCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-white/10 rounded-3xl w-full max-w-lg p-8 relative shadow-2xl">
            <h2 className="text-2xl font-semibold mb-2">Send Announcement</h2>
            <p className="text-muted-foreground mb-6">Message all students enrolled in <strong>{announcementCourse.title}</strong></p>
            
            <form onSubmit={handleSendAnnouncement} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Message</label>
                <textarea 
                  value={announcementMessage}
                  onChange={e => setAnnouncementMessage(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-foreground focus:outline-none focus:border-white/20 min-h-[120px]"
                  placeholder="Hello students..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="px-6 py-3 rounded-full font-semibold border border-white/10 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={sendingAnnouncement || !announcementMessage.trim()}
                  className="px-6 py-3 rounded-full font-semibold bg-foreground text-background hover:scale-[1.02] transition-transform disabled:opacity-50"
                >
                  {sendingAnnouncement ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

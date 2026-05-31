import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PlayCircle, BookOpen, Clock, CheckCircle2, Heart, Star, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCredits } from '../contexts/CreditsContext';
import { db, auth } from '../lib/firebase';

const API_BASE = import.meta.env.VITE_API_URL || '';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { jsPDF } from 'jspdf';

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

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

interface CoursePreviewProps {
  course: Course | null;
  onClose: () => void;
}

export function CoursePreview({ course, onClose }: CoursePreviewProps) {
  const { user } = useAuth();
  const { spend, tier } = useCredits();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [completedModules, setCompletedModules] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'highest' | 'lowest'>('newest');

  useEffect(() => {
    if (user && course) {
      const checkUserData = async () => {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          const savedCourses = data.savedCourses || [];
          const wishlist = data.wishlist || [];
          setIsEnrolled(savedCourses.includes(course.id));
          setIsWishlisted(wishlist.includes(course.id));
          
          if (data.progress && data.progress[course.id]) {
            setCompletedModules(data.progress[course.id]);
          } else {
            setCompletedModules(0);
          }
        }
      };
      checkUserData();
    } else {
      setIsEnrolled(false);
      setIsWishlisted(false);
      setCompletedModules(0);
    }
  }, [user, course]);

  useEffect(() => {
    if (course) {
      const fetchReviews = async () => {
        try {
          const q = query(collection(db, `courses/${course.id}/reviews`), orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(q);
          const data: Review[] = [];
          snapshot.forEach(doc => {
            data.push({ id: doc.id, ...doc.data() } as Review);
          });
          setReviews(data);
        } catch (err) {
          console.error("Failed to fetch reviews", err);
        }
      };
      fetchReviews();
    } else {
      setReviews([]);
    }
  }, [course]);

  const handleSaveCourse = async () => {
    if (!user) {
      toast.error("Please sign in to enroll!");
      return;
    }
    const price = course?.price || 0;
    const creditCost = price * 100;
    let creditsDeducted = false;
    if (price > 0 && tier === 'free') {
      const success = await spend(creditCost, `Enrolled in: ${course?.title}`);
      if (!success) {
        toast.error(`Need ${creditCost} credits to enroll. Visit Credits page to top up.`);
        return;
      }
      creditsDeducted = true;
    }
    toast.loading("Enrolling...", { id: "enroll" });
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        savedCourses: arrayUnion(course?.id),
        [`progress.${course?.id}`]: 1
      }).catch(async (e) => {
        if (e.code === 'not-found') {
          const { setDoc } = await import('firebase/firestore');
          await setDoc(userRef, { savedCourses: [course?.id], progress: { [course?.id as string]: 1 }, wishlist: [], credits: 0 });
        } else {
          throw e;
        }
      });
      setIsEnrolled(true);
      setCompletedModules(1);
      toast.success("Successfully enrolled!", { id: "enroll" });
    } catch (err) {
      console.error("Error saving course", err);
      if (creditsDeducted) {
        const idToken = await auth.currentUser?.getIdToken();
        if (idToken) {
          await fetch(`${API_BASE}/api/refund`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify({ amount: creditCost, description: `Refund: enrollment failed for ${course?.title}` }),
          });
        }
      }
      toast.error("Failed to enroll.", { id: "enroll" });
    }
  };

  const handleToggleWishlist = async () => {
    if (!user || !course) {
      toast.error("Please sign in to wishlist courses!");
      return;
    }
    const userRef = doc(db, 'users', user.uid);
    try {
      if (isWishlisted) {
        await updateDoc(userRef, {
          wishlist: arrayRemove(course.id)
        });
        setIsWishlisted(false);
        toast.success("Removed from wishlist");
      } else {
        await updateDoc(userRef, {
          wishlist: arrayUnion(course.id)
        }).catch(async (e) => {
          if (e.code === 'not-found') {
            const { setDoc } = await import('firebase/firestore');
            await setDoc(userRef, { wishlist: [course.id], savedCourses: [], progress: {}, credits: 0 });
          } else {
            throw e;
          }
        });
        setIsWishlisted(true);
        toast.success("Added to wishlist");
      }
    } catch (err) {
      console.error("Failed to toggle wishlist", err);
      toast.error("Wishlist update failed");
    }
  };

  const handleContinue = async () => {
    if (!user || !course) return;
    const nextMod = Math.min((completedModules || 0) + 1, course.totalModules || 12);
    setCompletedModules(nextMod);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        [`progress.${course.id}`]: nextMod
      });
      toast.success("Progress saved!");
    } catch(err) {
      toast.error("Failed to save progress");
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !course || !newReview.comment.trim()) return;
    setSubmittingReview(true);
    try {
      const reviewData = {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, `courses/${course.id}/reviews`), reviewData);
      setReviews([{ id: docRef.id, ...reviewData }, ...reviews]);
      setNewReview({ rating: 5, comment: '' });
      toast.success("Review added!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDownloadCertificate = () => {
    if (!user || !course) return;
    const padding = 20;
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFillColor(245, 245, 245);
    doc.rect(0, 0, 297, 210, 'F');
    doc.setLineWidth(2);
    doc.setDrawColor(40, 40, 40);
    doc.rect(padding, padding, 297 - 2 * padding, 210 - 2 * padding, 'S');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(40);
    doc.setTextColor(30, 30, 30);
    doc.text("Certificate of Completion", 148.5, 60, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text("This is to certify that", 148.5, 90, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.text(user.displayName || 'Student', 148.5, 110, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text("has successfully completed the course", 148.5, 130, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(50, 100, 200);
    const titleLines = doc.splitTextToSize(course.title, 200);
    doc.text(titleLines, 148.5, 150, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date of Completion: ${new Date().toLocaleDateString()}`, 148.5, 175, { align: "center" });

    doc.save(`Certificate_${course.title.replace(/\s+/g, '_')}.pdf`);
  };

  const totalMod = course?.totalModules || 12;
  const progressPercent = Math.round((completedModules / totalMod) * 100);

  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortOrder === 'highest') {
        return b.rating - a.rating;
      }
      if (sortOrder === 'lowest') {
        return a.rating - b.rating;
      }
      return 0;
    });
  }, [reviews, sortOrder]);

  return (
    <AnimatePresence>
      {course && (
        <React.Fragment>
          <Helmet>
            <title>{course.title} | Guidenza</title>
            <meta name="description" content={course.description} />
            <meta property="og:title" content={`${course.title} | Guidenza`} />
            <meta property="og:description" content={course.description} />
            <meta property="og:type" content="product" />
            {course.thumbnail && <meta property="og:image" content={course.thumbnail} />}
            {course.price > 0 && <meta property="product:price:amount" content={String(course.price)} />}
            <meta property="product:price:currency" content="USD" />
          </Helmet>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative shadow-2xl custom-scrollbar"
            >
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <button
                  onClick={handleToggleWishlist}
                  className="w-10 h-10 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md border border-white/10"
                >
                  <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} className={isWishlisted ? "text-red-500" : ""} />
                </button>
                <button
                  onClick={onClose}
                  className="w-10 h-10 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md border border-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="relative h-64 md:h-80 w-full bg-muted">
                <img 
                  src={course.thumbnail || "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800"} 
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                    <PlayCircle size={32} className="text-white ml-1" />
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1 rounded-full border border-white/10 text-xs font-medium bg-white/5">
                      {totalMod} Modules
                    </span>
                    {course.categories?.slice(0,1).map(cat => (
                      <span key={cat} className="px-3 py-1 rounded-full border border-white/10 text-xs font-medium bg-white/5">
                        {cat}
                      </span>
                    ))}
                  </div>
                  {isEnrolled && (
                    <div className="flex flex-col items-end gap-1 w-1/3">
                      <div className="flex justify-between w-full text-xs font-medium text-muted-foreground">
                        <span>Progress</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          className="h-full bg-foreground"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <h2 className="text-3xl font-semibold mb-2">{course.title}</h2>
                <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
                  <span>Instructor: <Link to={`/instructor/${encodeURIComponent(course.author)}`} onClick={onClose} className="text-foreground hover:underline font-medium">{course.author}</Link></span>
                </div>

                <p className="text-muted-foreground leading-relaxed mb-8">
                  {course.description}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
                  {!isEnrolled ? (
                    <>
                      <button 
                        onClick={handleSaveCourse}
                        className="w-full sm:w-auto px-8 py-3 bg-foreground text-background font-semibold rounded-full hover:scale-[1.02] transition-transform"
                      >
                        Enroll for ${course.price}
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={handleContinue}
                        disabled={progressPercent === 100}
                        className="w-full sm:w-auto px-8 py-3 bg-foreground text-background font-semibold rounded-full hover:scale-[1.02] transition-transform flex items-center gap-2 justify-center disabled:opacity-50"
                      >
                        <PlayCircle size={18} />
                        {progressPercent === 100 ? 'Completed' : 'Continue Learning'}
                      </button>
                      <span className="text-sm font-medium text-green-400 flex items-center gap-1 border border-green-500/30 bg-green-500/10 px-4 py-2 rounded-full">
                        <CheckCircle2 size={16} /> Enrolled
                      </span>
                      {progressPercent === 100 && (
                        <button 
                          onClick={handleDownloadCertificate}
                          className="w-full sm:w-auto px-6 py-3 border border-white/10 font-semibold rounded-full hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                        >
                          <Download size={18} />
                          Certificate
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Reviews Section */}
                <div className="pt-8 border-t border-border/30">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h3 className="text-xl font-semibold">Student Reviews ({reviews.length})</h3>
                    {reviews.length > 0 && (
                      <select 
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as any)}
                        className="bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-foreground focus:outline-none focus:border-white/20"
                      >
                        <option value="newest">Newest First</option>
                        <option value="highest">Highest Rated</option>
                        <option value="lowest">Lowest Rated</option>
                      </select>
                    )}
                  </div>
                  
                  {isEnrolled && (
                    <form onSubmit={handleSubmitReview} className="mb-8 bg-white/5 p-4 rounded-xl border border-white/5">
                      <h4 className="font-medium text-sm mb-3">Write a Review</h4>
                      <div className="flex gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button 
                            key={star} 
                            type="button"
                            onClick={() => setNewReview({...newReview, rating: star})}
                            className="text-yellow-400 focus:outline-none"
                          >
                            <Star size={20} fill={star <= newReview.rating ? "currentColor" : "none"} strokeWidth={1} />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={newReview.comment}
                        onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                        placeholder="What did you think of this course?"
                        className="w-full bg-background border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-white/20 mb-3 min-h-[80px]"
                        required
                      />
                      <button 
                        type="submit" 
                        disabled={submittingReview || !newReview.comment.trim()}
                        className="px-4 py-2 bg-foreground text-background text-sm font-semibold rounded-full disabled:opacity-50 transition-colors"
                      >
                        {submittingReview ? 'Submitting...' : 'Post Review'}
                      </button>
                    </form>
                  )}

                  <div className="space-y-4">
                    {sortedReviews.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No reviews yet.</p>
                    ) : (
                      sortedReviews.map(review => (
                        <div key={review.id} className="p-4 rounded-xl liquid-glass border border-white/5">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium text-sm text-foreground">{review.userName}</div>
                              <div className="flex text-yellow-400 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} strokeWidth={1} />
                                ))}
                              </div>
                            </div>
                            {review.createdAt && (
                              <div className="text-xs text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}

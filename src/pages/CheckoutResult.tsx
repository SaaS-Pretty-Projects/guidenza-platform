import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle2, X } from 'lucide-react';

export function CheckoutResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');

  useEffect(() => {
    if (!user) return;

    const transactionId = searchParams.get('transaction_id');
    const courseId = searchParams.get('course_id');

    if (!transactionId || !courseId) {
      setStatus('failed');
      return;
    }

    const check = async () => {
      for (let i = 0; i < 30; i++) {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const purchasedCourses: string[] = snap.data().purchasedCourses ?? [];
          if (purchasedCourses.includes(courseId)) {
            setStatus('success');
            return;
          }
        }
        await new Promise(r => setTimeout(r, 1000));
      }
      setStatus('failed');
    };

    check();
  }, [user, searchParams]);

  const handleGoToCourse = () => {
    navigate('/explore');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center">
        {status === 'verifying' && (
          <div>
            <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-muted-foreground">Please wait while we confirm your purchase...</p>
          </div>
        )}
        {status === 'success' && (
          <div>
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground mb-6">Your course has been unlocked. Start learning now.</p>
            <button
              onClick={handleGoToCourse}
              className="px-8 py-3 bg-foreground text-background font-semibold rounded-full"
            >
              Go to Course
            </button>
          </div>
        )}
        {status === 'failed' && (
          <div>
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <X size={32} className="text-red-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Payment Verification Failed</h2>
            <p className="text-muted-foreground mb-6">
              We couldn't verify your payment. If you were charged, please contact support.
            </p>
            <button
              onClick={() => navigate('/explore')}
              className="px-8 py-3 bg-foreground text-background font-semibold rounded-full"
            >
              Back to Explore
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

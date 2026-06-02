import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const API_BASE = 'http://localhost:4000/api';

export interface Order {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'refunded';
  safePayTransactionId: string;
  createdAt: any;
}

export async function hasPurchasedCourse(uid: string, courseId: string): Promise<boolean> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return false;
  const purchasedCourses: string[] = snap.data().purchasedCourses ?? [];
  return purchasedCourses.includes(courseId);
}

export async function getUserOrders(uid: string): Promise<Order[]> {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
}

export async function initiateCheckout(
  userId: string,
  courseId: string,
  amount: number,
  currency = 'PKR',
): Promise<string> {
  const res = await fetch(`${API_BASE}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, courseId, amount, currency }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Checkout failed');
  }

  const data = await res.json();
  return data.checkoutUrl;
}

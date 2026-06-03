import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserOrders, Order } from '../lib/orders';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<(Order & { courseTitle?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      const userOrders = await getUserOrders(user.uid);
      const withTitles = await Promise.all(
        userOrders.map(async (order) => {
          try {
            const courseSnap = await getDoc(doc(db, 'courses', order.courseId));
            const courseTitle = courseSnap.exists() ? courseSnap.data().title : 'Unknown Course';
            return { ...order, courseTitle };
          } catch {
            return { ...order, courseTitle: 'Unknown Course' };
          }
        }),
      );
      setOrders(withTitles);
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <p className="text-muted-foreground text-sm">Sign in to view your orders.</p>;
  }

  if (orders.length === 0) {
    return <p className="text-muted-foreground text-sm">No orders yet.</p>;
  }

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-400',
    confirmed: 'text-green-400',
    refunded: 'text-red-400',
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold mb-4">Purchase History</h3>
      {orders.map(order => (
        <div key={order.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <div>
            <p className="text-sm font-medium">{order.courseTitle}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(order.createdAt?.toDate?.() ?? order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm">{order.currency === 'PKR' ? 'Rs.' : '$'}{order.amount}</p>
            <p className={`text-xs font-medium ${statusColors[order.status] ?? 'text-muted-foreground'}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

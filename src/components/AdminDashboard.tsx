import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { Users, DollarSign, BookOpen, Shield, Search, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  credits: number;
  tier: string;
  role: string;
  createdAt?: { seconds: number };
}

interface PlatformStats {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  activeSubscriptions: number;
}

const ADMIN_EMAILS = ['wysness@gmail.com'];

export function AdminDashboard() {
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<PlatformStats>({ totalUsers: 0, totalCourses: 0, totalRevenue: 0, activeSubscriptions: 0 });
  const [fetching, setFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'courses' | 'withdrawals'>('overview');
  const [creditAdjust, setCreditAdjust] = useState<{ userId: string; amount: string } | null>(null);

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (!isAdmin) {
      setFetching(false);
      return;
    }

    const fetchData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersData: UserRecord[] = [];
        usersSnap.forEach(d => usersData.push({ id: d.id, ...d.data() } as UserRecord));
        setUsers(usersData);

        const coursesSnap = await getDocs(collection(db, 'courses'));

        const revenue = usersData.reduce((sum, u) => {
          if (u.tier === 'pro') return sum + 19;
          if (u.tier === 'enterprise') return sum + 49;
          return sum;
        }, 0);

        setStats({
          totalUsers: usersData.length,
          totalCourses: coursesSnap.size,
          totalRevenue: revenue,
          activeSubscriptions: usersData.filter(u => u.tier && u.tier !== 'free').length
        });
      } catch (err) {
        console.error('Admin fetch error:', err);
        toast.error('Failed to load admin data');
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  const handleAdjustCredits = async () => {
    if (!creditAdjust) return;
    const amount = parseInt(creditAdjust.amount);
    if (isNaN(amount)) {
      toast.error('Invalid amount');
      return;
    }
    try {
      const userRef = doc(db, 'users', creditAdjust.userId);
      const currentUser = users.find(u => u.id === creditAdjust.userId);
      await updateDoc(userRef, { credits: (currentUser?.credits || 0) + amount });
      setUsers(users.map(u => u.id === creditAdjust.userId ? { ...u, credits: (u.credits || 0) + amount } : u));
      toast.success(`Adjusted ${amount} credits`);
      setCreditAdjust(null);
    } catch (err) {
      toast.error('Failed to adjust credits');
    }
  };

  const handleSetRole = async (userId: string, role: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role });
      setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
      toast.success(`Role updated to ${role}`);
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  if (loading || fetching) {
    return <div className="min-h-screen pt-32 px-6 flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-32 px-6 flex flex-col items-center justify-center">
        <Shield className="w-12 h-12 text-red-400 mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <Helmet><title>Admin | Guidenza</title></Helmet>

      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-6 h-6 text-accent" />
        <h1 className="text-3xl font-semibold tracking-tight">Admin Backoffice</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
          { label: 'Total Courses', value: stats.totalCourses, icon: BookOpen, color: 'text-green-400' },
          { label: 'Monthly Revenue', value: `$${stats.totalRevenue}`, icon: DollarSign, color: 'text-yellow-400' },
          { label: 'Active Subs', value: stats.activeSubscriptions, icon: TrendingUp, color: 'text-purple-400' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="liquid-glass rounded-xl border border-white/5 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-semibold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-white/5 rounded-full w-fit">
        {(['overview', 'users', 'courses', 'withdrawals'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              activeTab === tab ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-full text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50"
            />
          </div>

          <div className="liquid-glass rounded-xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">User</th>
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">Credits</th>
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">Tier</th>
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">Role</th>
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-white/3">
                      <td className="px-4 py-3">
                        <p className="font-medium">{u.displayName || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">{(u.credits || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.tier === 'pro' ? 'bg-accent/10 text-accent' :
                          u.tier === 'enterprise' ? 'bg-purple-500/10 text-purple-400' :
                          'bg-white/5 text-muted-foreground'
                        }`}>
                          {u.tier || 'free'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role || 'student'}
                          onChange={(e) => handleSetRole(u.id, e.target.value)}
                          className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs"
                        >
                          <option value="student">Student</option>
                          <option value="instructor">Instructor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setCreditAdjust({ userId: u.id, amount: '' })}
                          className="text-xs text-accent hover:underline"
                        >
                          Adjust Credits
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="liquid-glass rounded-xl border border-white/5 p-6">
          <h3 className="text-lg font-medium mb-4">Platform Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm text-muted-foreground mb-2">Recent Users</h4>
              <div className="space-y-2">
                {users.slice(0, 5).map(u => (
                  <div key={u.id} className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-sm">{u.displayName || u.email}</span>
                    <span className="text-xs text-muted-foreground">{u.tier || 'free'}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm text-muted-foreground mb-2">Revenue Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-sm">Pro Subscriptions</span>
                  <span className="text-sm text-green-400">${users.filter(u => u.tier === 'pro').length * 19}/mo</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-sm">Enterprise</span>
                  <span className="text-sm text-green-400">${users.filter(u => u.tier === 'enterprise').length * 49}/mo</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm font-medium">Total MRR</span>
                  <span className="text-sm font-medium text-green-400">${stats.totalRevenue}/mo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="liquid-glass rounded-xl border border-white/5 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
          <h3 className="font-medium mb-1">Withdrawal Requests</h3>
          <p className="text-sm text-muted-foreground">No pending withdrawal requests.</p>
        </div>
      )}

      {/* Credit Adjustment Modal */}
      {creditAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-medium mb-4">Adjust Credits</h3>
            <input
              type="number"
              value={creditAdjust.amount}
              onChange={(e) => setCreditAdjust({ ...creditAdjust, amount: e.target.value })}
              placeholder="Amount (negative to deduct)"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-accent/50"
            />
            <div className="flex gap-2">
              <button onClick={() => setCreditAdjust(null)} className="flex-1 py-2 rounded-lg bg-white/5 text-sm">Cancel</button>
              <button onClick={handleAdjustCredits} className="flex-1 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

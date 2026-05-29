import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import toast from 'react-hot-toast';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success("Successfully logged in!");
    } catch (error) {
      console.error('Error signing in with Google', error);
      toast.error("Failed to log in.");
    }
  };

  const logout = async () => {
    await signOut(auth);
    toast.success("Successfully logged out!");
  };

  return { user, loading, login, logout };
}

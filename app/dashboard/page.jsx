'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { supabase } from '@/lib/supabase';
import RoutineTextInput from '@/components/RoutineTextInput';
import RoutineDisplay from '@/components/RoutineDisplay';
import '../../styles/dashboard.css';
import { LogOut,RefreshCw } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/');
      } else {
        setUser(currentUser);
        fetchRoutine(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchRoutine = async (userId) => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (data) {
        setRoutine(data);
      } else {
        setRoutine(null);
      }
    } catch (err) {
      console.error('Error fetching routine:', err);
      setError('Failed to load routine');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleRoutineSaved = () => {
    if (user) {
      fetchRoutine(user.uid);
    }
  };

  const handleRefresh = () => {
    if (user) {
      fetchRoutine(user.uid);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Dashboard</h1>
          </div>
          <div className="header-right">
            <button onClick={handleRefresh} className="refresh-button">
		<RefreshCw size={20}  /> 
            </button>
            <button onClick={handleSignOut} className="signout-button">
		<LogOut size={20} /> 
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        {error && (
          <div className="error-container">
            {error}
          </div>
        )}

        <RoutineTextInput 
          userId={user?.uid} 
          onRoutineSaved={handleRoutineSaved}
        />

        <RoutineDisplay routine={routine} />
      </main>
    </div>
  );
}

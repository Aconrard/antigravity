'use client';

import { useState } from 'react';
import AuthGate from '@/components/AuthGate';
import ReportGenerator from '@/components/ReportGenerator';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [instructorId, setInstructorId] = useState('');

  const handleLogin = (id: string) => {
    setInstructorId(id);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch (err) {
      console.warn('Silent failure on server side logout', err);
    } finally {
      setIsAuthenticated(false);
      setInstructorId('');
    }
  };

  if (!isAuthenticated) {
    return <AuthGate onAuthenticated={handleLogin} />;
  }

  return <ReportGenerator instructorId={instructorId} onLogout={handleLogout} />;
}

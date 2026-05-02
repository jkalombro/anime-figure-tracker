import React from 'react';
import { useDarkMode } from './shared/hooks/useDarkMode';
import { useAuth } from './shared/context/AuthContext';
import { LoadingScreen } from './shared/components/Loading';

export function Layout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  useDarkMode(); // Initialize theme logic

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}

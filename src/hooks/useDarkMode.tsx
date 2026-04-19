import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return { isDark, toggleDark: () => setIsDark(!isDark) };
}

export function DarkModeToggle() {
  const { isDark, toggleDark } = useDarkMode();
  
  return (
    <button
      onClick={toggleDark}
      className="p-3 rounded-xl bg-bg-card border border-border-subtle text-accent-soft hover:bg-accent-primary hover:text-white transition-all shadow-sm active:scale-95"
      aria-label="Toggle dark mode"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}

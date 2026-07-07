'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '../lib/utils';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[100px] h-10 rounded-full bg-black/10 dark:bg-white/10" />;
  }

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        "relative flex items-center w-[100px] h-10 rounded-full p-1 transition-all duration-300 ease-in-out shadow-inner",
        isDark ? "bg-[#1E1A29]" : "bg-gray-200"
      )}
      aria-label="Toggle theme"
    >
      {/* Sliding Pill */}
      <div
        className={cn(
          "absolute h-8 w-8 rounded-full shadow-sm transition-transform duration-300 ease-in-out flex items-center justify-center z-10",
          isDark 
            ? "bg-[#2D283E] transform translate-x-[60px]" 
            : "bg-white transform translate-x-0"
        )}
      >
        {isDark ? (
          <Moon className="w-4 h-4 text-white" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
      </div>

      {/* Text Labels */}
      <div className="absolute inset-0 w-full flex items-center justify-between px-3 text-[10px] font-bold tracking-widest pointer-events-none">
        <span className={cn(
          "transition-opacity duration-300 ml-1",
          !isDark ? "opacity-0" : "text-gray-400 opacity-100"
        )}>
          DARK
        </span>
        <span className={cn(
          "transition-opacity duration-300 mr-1",
          isDark ? "opacity-0" : "text-gray-500 opacity-100"
        )}>
          LIGHT
        </span>
      </div>
    </button>
  );
}

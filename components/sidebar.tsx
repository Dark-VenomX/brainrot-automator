'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../lib/utils';
import { 
  Video, Calendar, Box, BookOpen, Settings, LogOut, Search 
} from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { useAuth } from '../hooks/useAuth';

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const navItems = [
    { name: 'Dashboard', href: '/workspace', icon: <Box className="w-5 h-5" /> },
    { name: 'Docs', href: '/how-to-use', icon: <BookOpen className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-[260px] h-screen sticky top-0 flex flex-col border-r border-slate-200 dark:border-white/10 bg-white/40 dark:bg-[#06040A]/40 backdrop-blur-2xl transition-colors duration-300">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 shadow-lg shadow-purple-500/20 flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">brainrot.ai</span>
        </Link>
      </div>

      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none transition-all placeholder:text-slate-400 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Main Menu</div>
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium",
              pathname === item.href 
                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            {item.icon}
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-200 dark:border-white/10 space-y-4">
        <div className="flex items-center justify-between px-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Theme</span>
          <ThemeToggle />
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all font-medium"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

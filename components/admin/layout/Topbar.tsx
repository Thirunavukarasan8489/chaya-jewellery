'use client';

import { Search, Bell, Moon, Sun, User as UserIcon, Menu, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const [isDark, setIsDark] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { data: session } = useSession();
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Simple toggle for dark mode (requires a ThemeProvider in layout)
  const toggleDark = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-plum-900 border-b border-gray-200 dark:border-plum-800 flex items-center justify-between px-4 md:px-6 shadow-xs backdrop-blur-md z-10">
      
      {/* Left side: Search & Mobile Menu */}
      <div className="flex-1 flex items-center gap-2">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-plum-700 dark:text-plum-200 hover:bg-plum-100 dark:hover:bg-plum-800 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-4">
        

        <div className="h-6 w-px bg-gray-200 dark:bg-plum-800 mx-1"></div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleDark}
          className="p-2 text-plum-600 dark:text-plum-300 hover:bg-plum-100 dark:hover:bg-plum-800 rounded-full transition-colors"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-plum-600 dark:text-plum-300 hover:bg-plum-100 dark:hover:bg-plum-800 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-plum-900 rounded-full"></span>
        </button>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 hover:bg-plum-100 dark:hover:bg-plum-800 rounded-full pr-3 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-plum-700"
          >
            <div className="w-8 h-8 bg-plum-100 dark:bg-plum-800 rounded-full flex items-center justify-center text-plum-700 dark:text-plum-200 border border-plum-200 dark:border-plum-700">
              <UserIcon size={16} />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-plum-900 dark:text-ivory-100 leading-none">
                {session?.user?.name || 'Admin User'}
              </p>
              <p className="text-xs text-plum-600 dark:text-plum-400 mt-1 capitalize font-medium">
                {((session as any)?.role as string)?.replace('_', ' ').toLowerCase() || 'Super Admin'}
              </p>
            </div>
            <ChevronDown size={14} className="text-plum-400 hidden md:block" />
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-plum-900 rounded-xl shadow-lg border border-gray-200 dark:border-plum-800 py-1 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-plum-800 md:hidden">
                <p className="text-sm font-semibold text-plum-900 dark:text-ivory-100">
                  {session?.user?.name || 'Admin User'}
                </p>
                <p className="text-xs text-plum-500 dark:text-plum-400 capitalize mt-1">
                  {((session as any)?.role as string)?.replace('_', ' ').toLowerCase() || 'Super Admin'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsProfileOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-plum-800 dark:text-plum-200 hover:bg-plum-50 dark:hover:bg-plum-800 flex items-center gap-2"
              >
                <Settings size={16} className="text-plum-400" />
                Account Settings
              </button>
              <button 
                onClick={() => {
                  setIsProfileOpen(false);
                  signOut({ callbackUrl: '/admin/login' });
                }}
                className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

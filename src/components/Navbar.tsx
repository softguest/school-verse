import React from 'react';
import { School, User, GraduationCap, Flame, Bell, Shield, Users, Sparkles, BookOpen, Gamepad2 } from 'lucide-react';
import { Student } from '../types/index.ts';

interface NavbarProps {
  student: Student | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount: number;
  onOpenRoster: () => void;
  onOpenNotifications: () => void;
  isTeacherMode: boolean;
  setIsTeacherMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  student,
  activeTab,
  setActiveTab,
  unreadCount,
  onOpenRoster,
  onOpenNotifications,
  isTeacherMode,
  setIsTeacherMode,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg p-1"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 shadow-sm font-bold">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
                SchoolVerse
              </span>
              {student && (
                <div className="text-[11px] text-slate-400 leading-none truncate max-w-[150px] sm:max-w-none">
                  {student.schoolName || 'Virtual Campus'}
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Zone 2: Concise navigation links */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'dashboard' ? 'text-amber-400 font-semibold' : 'hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('campus')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'campus' ? 'text-amber-400 font-semibold' : 'hover:text-white'
            }`}
          >
            Campus
          </button>
          <button
            onClick={() => setActiveTab('campus_world')}
            className="whitespace-nowrap flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-bold transition-all hover:scale-105"
            title="Launch 2D Multiplayer Virtual Campus"
          >
            <Gamepad2 className="h-3.5 w-3.5 text-amber-400" />
            <span>2D World</span>
          </button>
          <button
            onClick={() => setActiveTab('missions')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'missions' ? 'text-amber-400 font-semibold' : 'hover:text-white'
            }`}
          >
            Missions
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'leaderboard' ? 'text-amber-400 font-semibold' : 'hover:text-white'
            }`}
          >
            Leaderboards
          </button>
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'opportunities' ? 'text-amber-400 font-semibold' : 'hover:text-white'
            }`}
          >
            Opportunities
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'chat' ? 'text-amber-400 font-semibold' : 'hover:text-white'
            }`}
          >
            Lounge & Chat
          </button>
          {isTeacherMode && (
            <button
              onClick={() => setActiveTab('teacher')}
              className={`whitespace-nowrap transition-colors py-1 ${
                activeTab === 'teacher' ? 'text-emerald-400 font-semibold' : 'text-emerald-400/80 hover:text-emerald-300'
              }`}
            >
              Teacher Assessment
            </button>
          )}
        </nav>

        {/* Zone 3: Student Status / Role Switcher Action */}
        <div className="flex items-center gap-3 shrink-0">
          {student && (
            <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5">
              <span className="flex items-center gap-1 text-amber-300 font-semibold tabular-nums">
                <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                {student.streak} Day Streak
              </span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span className="tabular-nums font-medium text-slate-300">
                Level {student.level}
              </span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span className="tabular-nums font-mono text-slate-200">
                {student.xp.toLocaleString()} XP
              </span>
            </div>
          )}

          {/* Notifications bell */}
          <button
            onClick={onOpenNotifications}
            aria-label="View notifications"
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-slate-950" />
            )}
          </button>

          {/* Switch Student / Teacher Mode Button */}
          <button
            onClick={onOpenRoster}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            title="Switch demo student or enter teacher assessment mode"
          >
            <Users className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Roster Switcher</span>
            <span className="sm:hidden">Switch</span>
          </button>

          {/* Student Profile Quick Button */}
          {student && (
            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              title={`Logged in as ${student.displayName}`}
            >
              <img
                src={student.avatar}
                alt={student.displayName}
                className="h-8 w-8 rounded-full bg-slate-800 border border-amber-500/30 object-cover"
                referrerPolicy="no-referrer"
              />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

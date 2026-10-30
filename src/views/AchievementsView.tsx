import React from 'react';
import { Award, CheckCircle2, Lock, Sparkles, Shield } from 'lucide-react';
import { Student } from '../types/index.ts';

interface AchievementsViewProps {
  student: Student & { badges: any[] };
}

const ALL_BADGES = [
  { id: 'b_first_day', code: 'first_day', name: 'First Day', description: 'Began the SchoolVerse journey and joined your school.', icon: '🎒', rarity: 'Common' },
  { id: 'b_math_explorer', code: 'math_explorer', name: 'Mathematics Explorer', description: 'Solved 3 or more advanced mathematics challenges.', icon: '🧮', rarity: 'Rare' },
  { id: 'b_sci_explorer', code: 'sci_explorer', name: 'Science Explorer', description: 'Investigated laboratory phenomena and natural sciences.', icon: '🔬', rarity: 'Rare' },
  { id: 'b_code_explorer', code: 'code_explorer', name: 'Coding Explorer', description: 'Debugged algorithms and cracked digital puzzles.', icon: '💻', rarity: 'Rare' },
  { id: 'b_bookworm', code: 'bookworm', name: 'Bookworm', description: 'Mastered literary comprehension in the library.', icon: '📚', rarity: 'Common' },
  { id: 'b_streak_7', code: 'streak_7', name: '7-Day Streak', description: 'Logged in and completed academic missions for 7 consecutive days.', icon: '🔥', rarity: 'Epic' },
  { id: 'b_first_mate', code: 'first_mate', name: 'First Mate', description: 'Formed your first study bond via the Mate Over system.', icon: '🤝', rarity: 'Common' },
  { id: 'b_top_100', code: 'top_100', name: 'Top 100 Champion', description: 'Reached the elite top 100 students nationwide.', icon: '🏆', rarity: 'Epic' },
  { id: 'b_inter_school', code: 'inter_school', name: 'Inter-School Explorer', description: 'Connected with peers from 3 different schools.', icon: '🌍', rarity: 'Rare' },
  { id: 'b_mission_master', code: 'mission_master', name: 'Mission Master', description: 'Successfully resolved 10 full academic missions.', icon: '🎯', rarity: 'Legendary' },
];

export const AchievementsView: React.FC<AchievementsViewProps> = ({ student }) => {
  const unlockedCodes = (student.badges || []).map((b) => b.code);

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'Legendary':
        return 'text-amber-300 bg-amber-500/20 border-amber-500/40';
      case 'Epic':
        return 'text-purple-300 bg-purple-500/20 border-purple-500/40';
      case 'Rare':
        return 'text-blue-300 bg-blue-500/20 border-blue-500/40';
      default:
        return 'text-slate-300 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Academic Badges & Achievements
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track milestones earned across mathematics, laboratory sciences, consistency streaks, and community leadership.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-amber-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Sparkles className="h-4 w-4" />
          <span className="font-semibold tabular-nums">
            {unlockedCodes.length} / {ALL_BADGES.length} Badges Unlocked
          </span>
        </div>
      </div>

      {/* Grid of Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_BADGES.map((badge) => {
          const isUnlocked = unlockedCodes.includes(badge.code);
          return (
            <div
              key={badge.id}
              className={`p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                isUnlocked
                  ? 'bg-slate-900/90 border-slate-700 shadow-md'
                  : 'bg-slate-950/40 border-slate-850 opacity-60'
              }`}
            >
              <div
                className={`text-3xl h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                  isUnlocked
                    ? 'bg-slate-950 border-amber-500/40 shadow-inner'
                    : 'bg-slate-950 border-slate-800 grayscale'
                }`}
              >
                {badge.icon}
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-white truncate">
                    {badge.name}
                  </h3>
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${getRarityBadge(
                      badge.rarity
                    )}`}
                  >
                    {badge.rarity}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {badge.description}
                </p>

                <div className="pt-1 flex items-center gap-1.5 text-[11px]">
                  {isUnlocked ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Unlocked
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Locked
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

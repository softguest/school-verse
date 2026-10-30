import React from 'react';
import { Sparkles, Trophy, ArrowRight, Award } from 'lucide-react';

interface LevelUpModalProps {
  newLevel: number;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  newLevel,
  onClose,
  onNavigateTab,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl shadow-amber-500/10">
        
        {/* Glow emblem */}
        <div className="relative mx-auto h-24 w-24 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <div className="h-20 w-20 rounded-full bg-slate-950 flex flex-col items-center justify-center text-amber-400">
            <Trophy className="h-7 w-7" />
            <span className="text-xs font-bold uppercase tracking-wider mt-0.5">Level</span>
            <span className="text-xl font-black font-mono leading-none">{newLevel}</span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tight">
            LEVEL UP! 🎉
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xs mx-auto leading-relaxed">
            Magnificent dedication! You have ascended to{' '}
            <span className="font-bold text-amber-400">Level {newLevel}</span>. Your school has gained ranking prestige.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl text-xs space-y-1.5 text-left">
          <div className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Unlocked Privileges:</span>
          </div>
          <ul className="text-slate-400 space-y-1 pl-5 list-disc text-[11px]">
            <li>New advanced academic challenges unlocked in the lab</li>
            <li>Eligibility progress unlocked in the Scholarship Hub</li>
            <li>Elevated standing in regional leaderboard rankings</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => {
              onClose();
              onNavigateTab('opportunities');
            }}
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <span>Check Unlocked Opportunities</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Continue Campus Life
          </button>
        </div>
      </div>
    </div>
  );
};

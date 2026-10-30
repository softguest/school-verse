import React, { useState } from 'react';
import {
  User,
  School,
  Flame,
  Trophy,
  Award,
  Sparkles,
  WifiOff,
  Eye,
  Check,
  Edit2,
  Save,
} from 'lucide-react';
import { Student } from '../types/index.ts';
import { api } from '../lib/api.ts';

interface ProfileViewProps {
  student: Student & { badges: any[]; matesCount: number };
  onProfileUpdated: () => void;
  onNavigateTab: (tab: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  student,
  onProfileUpdated,
  onNavigateTab,
}) => {
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(student.bio || '');
  const [offlineCached, setOfflineCached] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveBio = async () => {
    setIsSaving(true);
    try {
      await api.updateProfile({ bio: bioText });
      setIsEditingBio(false);
      onProfileUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          
          <div className="flex items-center gap-5">
            <img
              src={student.avatar}
              alt={student.displayName}
              className="h-20 w-20 rounded-2xl bg-slate-800 border-2 border-amber-500/50 shadow-lg object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {student.displayName}
              </h1>
              <div className="text-xs text-slate-400 font-mono">
                @{student.username}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <School className="h-3.5 w-3.5 text-amber-400" />
                <span>{student.schoolName}</span>
                <span aria-hidden="true">·</span>
                <span>{student.grade}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                {student.region}, {student.country}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-center">
              <div className="text-xs text-slate-400">Total XP</div>
              <div className="text-lg font-bold text-amber-400 font-mono tabular-nums">
                {student.xp.toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-center">
              <div className="text-xs text-slate-400">School Points</div>
              <div className="text-lg font-bold text-emerald-400 font-mono tabular-nums">
                {student.schoolPoints}
              </div>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Student Statement / Bio
            </h2>
            {!isEditingBio && (
              <button
                onClick={() => setIsEditingBio(true)}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <Edit2 className="h-3 w-3" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {isEditingBio ? (
            <div className="space-y-2">
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsEditingBio(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBio}
                  disabled={isSaving}
                  className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300 flex items-center gap-1 shadow-sm"
                >
                  <Save className="h-3 w-3" />
                  <span>{isSaving ? 'Saving...' : 'Save Bio'}</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic bg-slate-950/40 p-3 rounded-xl border border-slate-850">
              "{student.bio || 'Eager learner on SchoolVerse.'}"
            </p>
          )}
        </div>

        {/* Academic Interests */}
        <div className="mt-5 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Academic & Co-Curricular Focus
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {student.interests.map((int: string) => (
              <span
                key={int}
                className="bg-slate-950 border border-slate-800 text-slate-200 px-3 py-1 rounded-lg"
              >
                {int}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Badges Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-400" />
            <span>Unlocked Badges ({student.badges?.length || 0})</span>
          </h2>
          <button
            onClick={() => onNavigateTab('achievements')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300"
          >
            View All Achievements →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(student.badges || []).slice(0, 4).map((b: any) => (
            <div
              key={b.id}
              className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex items-center gap-3"
            >
              <div className="text-2xl">{b.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{b.name}</div>
                <div className="text-[10px] text-slate-400">{b.rarity}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accessibility & Low-Connectivity Features */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <WifiOff className="h-4 w-4 text-emerald-400" />
          <span>Accessibility & Offline Connectivity</span>
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Optimized for African students in areas with variable network connectivity and bandwidth limits.
        </p>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <div className="text-xs font-semibold text-white">Offline Mission Cache (PWA)</div>
              <div className="text-[11px] text-slate-400">
                Cache current day questions locally in browser storage for zero-data study sessions.
              </div>
            </div>
            <button
              onClick={() => setOfflineCached(!offlineCached)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                offlineCached
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {offlineCached ? 'Active' : 'Disabled'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <div className="text-xs font-semibold text-white">High Contrast & Screen Reader Mode</div>
              <div className="text-[11px] text-slate-400">
                Enhance visual contrast ratios and enable verbose aria narration labels.
              </div>
            </div>
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                highContrast
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {highContrast ? 'Enabled' : 'Standard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

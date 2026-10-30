import React, { useEffect, useState } from 'react';
import { X, UserCheck, Shield, PlusCircle, Check, Flame } from 'lucide-react';
import { api } from '../lib/api.ts';

interface RosterSwitcherModalProps {
  onClose: () => void;
  onStudentSwitched: () => void;
  onLaunchOnboarding: () => void;
  isTeacherMode: boolean;
  setIsTeacherMode: (val: boolean) => void;
}

export const RosterSwitcherModal: React.FC<RosterSwitcherModalProps> = ({
  onClose,
  onStudentSwitched,
  onLaunchOnboarding,
  isTeacherMode,
  setIsTeacherMode,
}) => {
  const [roster, setRoster] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getDemoRoster().then((data) => {
      setRoster(data.students);
      setActiveId(data.activeStudentId);
      setIsLoading(false);
    });
  }, []);

  const handleSelectStudent = async (studentId: string) => {
    try {
      await api.switchStudent(studentId);
      setIsTeacherMode(false);
      onStudentSwitched();
      onClose();
    } catch (err) {
      console.error('Failed to switch student:', err);
    }
  };

  const handleToggleTeacher = () => {
    setIsTeacherMode(!isTeacherMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/50">
          <div>
            <h3 className="text-base font-bold text-white">Select Student Identity</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Switch between simulated student profiles or launch Teacher Mode to evaluate real-time assessments.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List of students */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {isLoading ? (
            <div className="text-center py-8 text-sm text-slate-500">Loading student roster...</div>
          ) : (
            roster.map((s) => {
              const isActive = s.id === activeId && !isTeacherMode;
              return (
                <button
                  key={s.id}
                  onClick={() => handleSelectStudent(s.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={s.avatar}
                      alt={s.display_name}
                      className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{s.display_name}</span>
                        <span className="text-xs text-slate-400">@{s.username}</span>
                      </div>
                      <div className="text-xs text-slate-400 truncate max-w-[280px]">
                        {s.school_name} · {s.grade}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div>
                      <div className="text-xs font-semibold text-amber-400 tabular-nums">
                        Level {s.level}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                        {s.xp.toLocaleString()} XP
                      </div>
                    </div>
                    {isActive && (
                      <div className="h-5 w-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-800 px-6 py-4 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onLaunchOnboarding();
              onClose();
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Create New Student
          </button>

          <button
            onClick={handleToggleTeacher}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              isTeacherMode
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Shield className="h-4 w-4 text-emerald-400" />
            {isTeacherMode ? 'Teacher Mode Active' : 'Enter Teacher Mode'}
          </button>
        </div>
      </div>
    </div>
  );
};

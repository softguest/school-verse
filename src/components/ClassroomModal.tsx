import React, { useEffect, useState } from 'react';
import {
  X,
  BookOpen,
  GraduationCap,
  Sparkles,
  Users,
  Flame,
  Award,
  ChevronRight,
  CheckCircle2,
  Lock,
  ArrowRight,
  MessageSquare,
  Coffee,
  Atom,
  Code2,
} from 'lucide-react';
import { CampusBuilding, Student, Mission } from '../types/index.ts';
import { api } from '../lib/api.ts';

interface ClassroomModalProps {
  building: CampusBuilding;
  student: Student;
  onClose: () => void;
  onOpenMission: (missionId: string) => void;
  onOpenChatWithMate?: (mateStudentId: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const ClassroomModal: React.FC<ClassroomModalProps> = ({
  building,
  student,
  onClose,
  onOpenMission,
  onOpenChatWithMate,
  onNavigateTab,
}) => {
  const [details, setDetails] = useState<{
    missions: any[];
    schoolmates: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .getBuildingDetails(building.id)
      .then((data) => {
        if (isMounted) {
          setDetails({
            missions: data.missions || [],
            schoolmates: data.schoolmates || [],
          });
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load building details:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [building.id]);

  const getBuildingIcon = () => {
    switch (building.code) {
      case 'MATH':
        return BookOpen;
      case 'ENG':
      case 'LIBRARY':
        return GraduationCap;
      case 'SCI':
        return Atom;
      case 'CS':
        return Code2;
      case 'LOUNGE':
      case 'CAFETERIA':
        return Coffee;
      default:
        return Sparkles;
    }
  };

  const Icon = getBuildingIcon();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Banner */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 p-6 border-b border-slate-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    {building.doorLabel || building.code}
                  </span>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    {building.category}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
                  {building.name}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Return to campus"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-2xl">
            {building.narrativeIntro || building.description}
          </p>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="h-8 w-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mb-3" />
              <p className="text-sm text-slate-400">Opening classroom doors...</p>
            </div>
          ) : (
            <>
              {/* Academic Missions in this Classroom */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-amber-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                      Available Classroom Tasks & Missions
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    {details?.missions.length || 0} tasks available
                  </span>
                </div>

                {details?.missions && details.missions.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {details.missions.map((mission: any) => {
                      const isLocked = student.level < (mission.required_level || 1);
                      const isCompleted = Boolean(mission.completed);

                      return (
                        <div
                          key={mission.id}
                          className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            isCompleted
                              ? 'bg-emerald-950/20 border-emerald-800/40'
                              : isLocked
                              ? 'bg-slate-900/60 border-slate-800/50 opacity-60'
                              : 'bg-slate-800/40 border-slate-700/60 hover:border-amber-500/50 hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded ${
                                  mission.difficulty === 'easy'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : mission.difficulty === 'medium'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}
                              >
                                {mission.difficulty}
                              </span>
                              {mission.is_daily_challenge ? (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                                  <Flame className="h-3 w-3 text-purple-400" /> Daily Focus
                                </span>
                              ) : null}
                              <span className="text-xs text-slate-400 font-mono">
                                Req. Lv{mission.required_level || 1}
                              </span>
                            </div>

                            <h4 className="text-base font-bold text-white flex items-center gap-2">
                              {mission.title}
                              {isCompleted && (
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 inline" />
                              )}
                            </h4>
                            <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                              {mission.description}
                            </p>

                            <div className="flex items-center gap-4 mt-2.5 text-xs">
                              <span className="text-amber-400 font-semibold flex items-center gap-1">
                                <Sparkles className="h-3.5 w-3.5" /> +{mission.xp_reward} XP
                              </span>
                              <span className="text-sky-400 font-semibold flex items-center gap-1">
                                <Award className="h-3.5 w-3.5" /> +{mission.points_reward} School Pts
                              </span>
                            </div>
                          </div>

                          <div>
                            {isCompleted ? (
                              <button
                                onClick={() => {
                                  onClose();
                                  onOpenMission(mission.id);
                                }}
                                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 hover:bg-emerald-900/60 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Review Result
                              </button>
                            ) : isLocked ? (
                              <div className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-semibold flex items-center justify-center gap-1.5">
                                <Lock className="h-3.5 w-3.5" />
                                Lv{mission.required_level} Locked
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  onClose();
                                  onOpenMission(mission.id);
                                }}
                                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                              >
                                Start Mission <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-800 text-center">
                    <p className="text-sm text-slate-400">
                      No formal classroom mission active right now in this zone. You can explore the
                      space, study with schoolmates, or visit the academic wings.
                    </p>
                    {building.code === 'LOUNGE' && onNavigateTab && (
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateTab('chat');
                        }}
                        className="mt-3 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> Open Campus Chat Lounge
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Schoolmates Studying Here */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-sky-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                      Classmates In This Wing
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    {details?.schoolmates.length || 0} online
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {details?.schoolmates && details.schoolmates.length > 0 ? (
                    details.schoolmates.map((mate: any) => (
                      <div
                        key={mate.id}
                        className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between gap-3 hover:bg-slate-800/70 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-slate-700 flex items-center justify-center text-sm font-bold text-amber-300 shrink-0">
                            {mate.avatar || mate.display_name?.charAt(0) || 'S'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {mate.display_name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Lv{mate.level} · {mate.grade || 'Student'}
                            </p>
                          </div>
                        </div>

                        {onOpenChatWithMate && (
                          <button
                            onClick={() => {
                              onClose();
                              onOpenChatWithMate(mate.id);
                            }}
                            className="px-2.5 py-1 rounded-md bg-slate-700/80 hover:bg-amber-400 hover:text-slate-950 text-slate-200 text-[11px] font-semibold transition-colors flex items-center gap-1"
                          >
                            <MessageSquare className="h-3 w-3" /> Chat
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 col-span-2 py-2">
                      No other schoolmates studying in this wing at this moment.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">ESC</kbd> or click button to exit building.
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold ml-auto transition-colors"
          >
            Return to Campus Quad
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  Filter,
  Search,
  Flame,
  ArrowRight,
  Atom,
  Code2,
  Globe2,
  Binary,
} from 'lucide-react';
import { Mission, Subject, Student } from '../types/index.ts';
import { api } from '../lib/api.ts';

interface MissionsViewProps {
  student: Student;
  onOpenMission: (missionId: string) => void;
  initialSubjectFilter?: string;
}

export const MissionsView: React.FC<MissionsViewProps> = ({
  student,
  onOpenMission,
  initialSubjectFilter,
}) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubjectFilter || 'all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getSubjects(), api.getMissions()]).then(([subs, miss]) => {
      setSubjects(subs);
      setMissions(miss);
      setLoading(false);
    });
  }, [student.id]);

  const filteredMissions = missions.filter((m) => {
    const matchesSubject =
      selectedSubject === 'all' ||
      m.subjectId === selectedSubject ||
      (subjects.find((s) => s.code === selectedSubject)?.id === m.subjectId);
    const matchesDifficulty =
      selectedDifficulty === 'all' || m.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesDifficulty && matchesSearch;
  });

  const getSubjectIcon = (code: string = '') => {
    switch (code) {
      case 'MATH':
        return Binary;
      case 'SCI':
        return Atom;
      case 'CS':
        return Code2;
      case 'GEN':
        return Globe2;
      default:
        return BookOpen;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Academic Missions & Challenges
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Solve curricular problems, master African and global knowledge, and earn persistent XP rewards.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>Server-validated grading · Immediate feedback</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        
        {/* Subject Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedSubject('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              selectedSubject === 'all'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            All Subjects ({missions.length})
          </button>
          {subjects.map((sub) => {
            const isSelected = selectedSubject === sub.id || selectedSubject === sub.code;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubject(sub.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span>{sub.name}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary controls: Difficulty & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search challenges by topic..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 shrink-0">Difficulty:</span>
            {['all', 'novice', 'intermediate', 'advanced'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-2.5 py-1 text-xs capitalize rounded-lg border transition-colors ${
                  selectedDifficulty === diff
                    ? 'border-amber-400 bg-amber-500/10 text-white font-semibold'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Missions Grid */}
      {loading ? (
        <div className="text-center py-16 text-sm text-slate-500">Loading academic missions...</div>
      ) : filteredMissions.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center space-y-2">
          <BookOpen className="h-8 w-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No missions found</h3>
          <p className="text-xs text-slate-400">Try adjusting your subject or difficulty filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMissions.map((m) => {
            const SubIcon = getSubjectIcon(
              subjects.find((s) => s.id === m.subjectId)?.code
            );
            return (
              <div
                key={m.id}
                className={`bg-slate-900/80 border rounded-2xl p-5 transition-all flex flex-col justify-between gap-4 ${
                  m.completed
                    ? 'border-emerald-500/30 hover:border-emerald-500/50'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-amber-400">{m.subjectName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{m.difficulty}</span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1 tabular-nums">
                        <Clock className="h-3 w-3" />
                        {m.estimatedMinutes}m
                      </span>
                    </div>

                    {m.completed ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed
                      </span>
                    ) : m.isDailyChallenge ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        <Flame className="h-3 w-3 fill-amber-400" />
                        Daily Challenge
                      </span>
                    ) : null}
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {m.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-mono font-bold text-amber-400 tabular-nums">
                      +{m.xpReward} XP
                    </div>
                    <div className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                      +{m.pointReward} Pts
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenMission(m.id)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm ${
                      m.completed
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                    }`}
                  >
                    <span>{m.completed ? 'Review Answers' : 'Start Mission'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Medal,
  TrendingUp,
  School,
  Users,
  Globe,
  MapPin,
  Check,
  Sparkles,
} from 'lucide-react';
import { Student, School as SchoolType } from '../types/index.ts';
import { api } from '../lib/api.ts';

interface LeaderboardViewProps {
  student: Student;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ student }) => {
  const [activeTab, setActiveTab] = useState<'students' | 'schools'>('students');
  const [scope, setScope] = useState<string>('global');
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [schoolsList, setSchoolsList] = useState<SchoolType[]>([]);
  const [currentStudentRank, setCurrentStudentRank] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (activeTab === 'students') {
      api.getStudentLeaderboard(scope).then((data) => {
        setStudentsList(data.students);
        setCurrentStudentRank(data.currentStudent.rank);
        setLoading(false);
      });
    } else {
      api.getSchoolLeaderboard().then((data) => {
        setSchoolsList(data);
        setLoading(false);
      });
    }
  }, [activeTab, scope, student.id]);

  const scopes = [
    { id: 'global', label: 'Pan-African & Global' },
    { id: 'country', label: `${student.country} (National)` },
    { id: 'region', label: `${student.region} Region` },
    { id: 'school', label: `${student.schoolName || 'School'}` },
    { id: 'mates', label: 'My Mates' },
  ];

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Hall of Champions & Leaderboards
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time standings computed server-side from verified academic mission achievements.
          </p>
        </div>

        {/* Tab Toggle: Student vs School Leaderboard */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'students'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Student Rankings</span>
          </button>
          <button
            onClick={() => setActiveTab('schools')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'schools'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <School className="h-3.5 w-3.5" />
            <span>School Rankings</span>
          </button>
        </div>
      </div>

      {/* STUDENT LEADERBOARD VIEW */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          
          {/* Your Current Rank Spotlight Card */}
          <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 font-extrabold text-xl shadow-md">
                #{currentStudentRank}
              </div>
              <div>
                <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
                  Your Current Standing
                </div>
                <div className="text-base font-bold text-white">
                  {student.displayName}
                </div>
                <div className="text-xs text-slate-400">
                  {student.schoolName} · Level {student.level} Scholar
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-right w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-800/80 pt-3 sm:pt-0">
              <div>
                <div className="text-xs text-slate-400">Academic XP</div>
                <div className="text-lg font-bold text-white font-mono tabular-nums">
                  {student.xp.toLocaleString()} XP
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Movement</div>
                <div className="flex items-center gap-1 text-sm font-bold text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                  <span>↑ 14 positions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scope Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {scopes.map((s) => (
              <button
                key={s.id}
                onClick={() => setScope(s.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  scope === s.id
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Student Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-16">Rank</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4 hidden sm:table-cell">School</th>
                    <th className="py-3 px-4 text-center">Level</th>
                    <th className="py-3 px-4 text-right">XP</th>
                    <th className="py-3 px-4 text-right hidden md:table-cell">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500">
                        Calculating standings...
                      </td>
                    </tr>
                  ) : (
                    studentsList.map((item) => {
                      const isMe = item.isCurrentStudent;
                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isMe
                              ? 'bg-amber-500/10 font-medium'
                              : 'hover:bg-slate-850/50'
                          }`}
                        >
                          <td className="py-3.5 px-4 font-bold tabular-nums">
                            {item.rank === 1 ? (
                              <span className="text-amber-400 flex items-center gap-1">
                                🥇 #1
                              </span>
                            ) : item.rank === 2 ? (
                              <span className="text-slate-300 flex items-center gap-1">
                                🥈 #2
                              </span>
                            ) : item.rank === 3 ? (
                              <span className="text-amber-600 flex items-center gap-1">
                                🥉 #3
                              </span>
                            ) : (
                              <span className="text-slate-400">#{item.rank}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.avatar}
                                alt={item.display_name}
                                className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <div className="font-semibold text-white flex items-center gap-2">
                                  <span>{item.display_name}</span>
                                  {isMe && (
                                    <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-1.5 py-0.2 rounded">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 sm:hidden">
                                  {item.school_code} · Level {item.level}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 hidden sm:table-cell text-slate-300">
                            <div>{item.school_name}</div>
                            <div className="text-[10px] text-slate-500">{item.school_country}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-semibold text-amber-400 tabular-nums">
                            {item.level}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-white tabular-nums">
                            {item.xp.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-emerald-400 tabular-nums hidden md:table-cell">
                            {item.school_points}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SCHOOL LEADERBOARD VIEW */}
      {activeTab === 'schools' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Sparkles className="h-4 w-4" />
              <span>Normalized Scoring Algorithm</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              School rankings do NOT simply sum total points—which would unfairly favor huge schools.
              Our formula evaluates average student academic score (40%), active participation rate (25%),
              mission completion rate (20%), and tournament battle performance (15%) to establish a truly level playing field.
            </p>
          </div>

          <div className="space-y-3">
            {schoolsList.map((sch) => {
              const isMySchool = sch.id === student.schoolId;
              return (
                <div
                  key={sch.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isMySchool
                      ? 'bg-amber-500/10 border-amber-500 shadow-lg'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 border border-slate-800 text-lg font-extrabold text-amber-400 shrink-0">
                      #{sch.rank}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{sch.name}</h3>
                        {isMySchool && (
                          <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-1.5 py-0.5 rounded">
                            YOUR SCHOOL
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {sch.city}, {sch.region} ({sch.country}) · Motto: <span className="italic">"{sch.motto}"</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-right w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-800/80 pt-3 sm:pt-0">
                    <div>
                      <div className="text-xs text-slate-400">Enrolled Scholars</div>
                      <div className="text-sm font-semibold text-white tabular-nums">
                        {sch.studentCount} active
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Total Points</div>
                      <div className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
                        {sch.points.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2">
                      <div className="text-[10px] text-amber-400 font-bold uppercase">Normalized Index</div>
                      <div className="text-base font-bold text-amber-300 font-mono tabular-nums">
                        {(sch.normalizedScore ?? (sch as any).normalized_score)?.toFixed(1) || '820.0'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

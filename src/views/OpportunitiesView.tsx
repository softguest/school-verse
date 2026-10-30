import React, { useEffect, useState } from 'react';
import {
  GraduationCap,
  Lock,
  Unlock,
  CheckCircle2,
  ExternalLink,
  Calendar,
  Award,
  Sparkles,
} from 'lucide-react';
import { Opportunity, Student } from '../types/index.ts';
import { api } from '../lib/api.ts';

interface OpportunitiesViewProps {
  student: Student;
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({ student }) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

  useEffect(() => {
    api.getOpportunities().then((data) => {
      setOpportunities(data);
      setLoading(false);
    });
  }, [student.id, student.xp]);

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Scholarship & Opportunities Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Unlock real external scholarships, tech bootcamps, and academic grants through mission mastery.
          </p>
        </div>

        <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>Curated opportunities for African & global secondary students</span>
        </div>
      </div>

      {/* Grid of Opportunities */}
      {loading ? (
        <div className="text-center py-16 text-sm text-slate-500">Evaluating eligibility...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opportunities.map((opp) => {
            const isUnlocked = opp.isUnlocked;
            const minLvl = opp.minLevel ?? opp.min_level ?? 1;
            const minPts = opp.minPoints ?? opp.min_points ?? 0;
            const extUrl = opp.externalUrl ?? opp.external_url ?? '#';
            return (
              <div
                key={opp.id}
                className={`bg-slate-900/80 border rounded-2xl p-5 transition-all flex flex-col justify-between gap-4 ${
                  isUnlocked
                    ? 'border-amber-500/40 hover:border-amber-500/70 shadow-lg'
                    : 'border-slate-800 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {opp.provider}
                    </span>

                    {isUnlocked ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                        <Unlock className="h-3 w-3" />
                        UNLOCKED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-full">
                        <Lock className="h-3 w-3 text-slate-500" />
                        LOCKED
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">
                    {opp.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {opp.description}
                  </p>

                  {/* Requirements Tracker */}
                  <div className="bg-slate-950/70 border border-slate-850 p-3 rounded-xl space-y-2">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Eligibility Requirements
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Minimum Level {minLvl}:</span>
                        <span className={student.level >= minLvl ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                          Level {student.level} {student.level >= minLvl ? '✓' : '(Need ' + (minLvl - student.level) + ' more)'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">School Points ({minPts}+):</span>
                        <span className={student.schoolPoints >= minPts ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                          {student.schoolPoints} pts {student.schoolPoints >= minPts ? '✓' : '(Need ' + (minPts - student.schoolPoints) + ' more)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-slate-400">Reward: </span>
                    <span className="font-semibold text-emerald-400">{opp.reward}</span>
                  </div>

                  {isUnlocked ? (
                    <a
                      href={extUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Apply Now</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <button
                      disabled
                      className="px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-950 border border-slate-800 rounded-lg cursor-not-allowed"
                    >
                      Complete Missions to Unlock
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

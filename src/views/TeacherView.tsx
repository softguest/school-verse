import React, { useEffect, useState } from 'react';
import {
  Shield,
  BookOpen,
  Users,
  CheckCircle2,
  Clock,
  Award,
  Sparkles,
  BarChart3,
  Send,
  PlusCircle,
} from 'lucide-react';
import { TeacherAssessment } from '../types/index.ts';
import { api } from '../lib/api.ts';

export const TeacherView: React.FC = () => {
  const [assessments, setAssessments] = useState<TeacherAssessment[]>([]);
  const [studentsProgress, setStudentsProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAssessment, setActiveAssessment] = useState<TeacherAssessment | null>(null);
  const [testAnswers, setTestAnswers] = useState<Record<number, string>>({});
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([api.getTeacherAssessments(), api.getStudentsProgress()]).then(
      ([assData, progData]) => {
        setAssessments(assData);
        setStudentsProgress(progData);
        if (assData.length > 0) setActiveAssessment(assData[0]);
        setLoading(false);
      }
    );
  }, []);

  const handleSubmitAssessment = async () => {
    if (!activeAssessment) return;
    try {
      const res = await api.submitAssessment(activeAssessment.id, testAnswers);
      setSubmittedScore(res.score);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Teacher Mode Header */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
              Faculty Dashboard · Teacher Mode
            </div>
            <h1 className="text-xl font-bold text-white">
              Mr. Fon (Mathematics & Science Department)
            </h1>
            <div className="text-xs text-slate-400">
              Bilingual Grammar School Molyko Buea · Real-time Student Monitoring
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-300 bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-xl">
          <span className="text-emerald-400 font-bold tabular-nums font-mono">{studentsProgress.length} Students</span> Enrolled
        </div>
      </div>

      {/* Grid: Assessments & Real-Time Performance Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Teacher-Led Assessments (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-400" />
              <span>Teacher-Led Curricular Assessments</span>
            </h2>
          </div>

          {assessments.map((a) => (
            <div
              key={a.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs text-slate-400">
                    {a.subjectName} · Target: {a.targetGrade}
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">{a.title}</h3>
                  <div className="text-xs text-slate-400 mt-1">
                    Deadline: {a.deadline} · {a.questions.length} questions
                  </div>
                </div>

                <div className="text-right shrink-0 bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Class Average</div>
                  <div className="text-base font-bold text-emerald-400 font-mono tabular-nums">
                    {a.averageScore}%
                  </div>
                </div>
              </div>

              {/* Assessment Question Preview / Interactive Grading */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Interactive Assessment Demo Preview
                </div>

                {a.questions.map((q: any, idx: number) => (
                  <div key={idx} className="bg-slate-950/70 border border-slate-850 rounded-xl p-4 space-y-2 text-xs">
                    <div className="font-semibold text-white">
                      Q{idx + 1}: {q.prompt}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt: string) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setTestAnswers((prev) => ({ ...prev, [idx]: opt }))}
                          className={`text-left p-2.5 rounded-lg border transition-colors ${
                            testAnswers[idx] === opt
                              ? 'border-emerald-400 bg-emerald-500/10 text-white font-medium'
                              : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <div className="text-[11px] text-slate-400 italic pt-1">
                      Expected Solution: <span className="text-emerald-400 font-medium">{q.correctAnswer}</span>
                    </div>
                  </div>
                ))}

                {submittedScore !== null ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center space-y-1">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto" />
                    <div className="text-sm font-bold text-white">Assessment Submitted & Recorded</div>
                    <div className="text-xs text-slate-300">
                      Evaluated Score: <span className="font-bold text-emerald-400 font-mono">{submittedScore}%</span>. Real-time class analytics updated!
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleSubmitAssessment}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-sm"
                  >
                    Submit Teacher-Led Assessment Attempt
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Real-time Student Performance Monitoring (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              <span>Real-Time Progress Tracking</span>
            </h2>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="text-xs text-slate-400">
              Live monitoring of student mission completion rates and accuracy across Form 5 & Upper Sixth:
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {studentsProgress.map((stud) => (
                <div
                  key={stud.id}
                  className="bg-slate-950/70 border border-slate-850 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={stud.avatar}
                      alt={stud.display_name}
                      className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700"
                    />
                    <div>
                      <div className="font-bold text-white">{stud.display_name}</div>
                      <div className="text-[11px] text-slate-400">
                        Level {stud.level} · {stud.grade}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-emerald-400 font-bold tabular-nums">
                      {stud.average_accuracy || 85}% Acc
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {stud.xp.toLocaleString()} XP
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Sparkles, BookOpen, Clock, ArrowRight, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Mission } from '../types/index.ts';
import { api } from '../lib/api.ts';

interface MissionSolverModalProps {
  mission: Mission | null;
  onClose: () => void;
  onMissionCompleted: (result: any) => void;
}

export const MissionSolverModal: React.FC<MissionSolverModalProps> = ({
  mission,
  onClose,
  onMissionCompleted,
}) => {
  if (!mission) return null;

  const questions = mission.questions || [];
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentQ = questions[currentQuestionIndex];

  const handleSelectOption = (option: string) => {
    if (!currentQ || submissionResult) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: option,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    // Check all questions answered
    const unanswered = questions.filter((q) => !selectedAnswers[q.id]);
    if (unanswered.length > 0) {
      setErrorMsg(`Please select an answer for Question ${questions.indexOf(unanswered[0]) + 1}.`);
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const result = await api.submitMission(mission.id, selectedAnswers);
      setSubmissionResult(result);
      if (result.passed) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      onMissionCompleted(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit mission answers.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-amber-400">{mission.subjectName || 'Academic Mission'}</span>
              <span aria-hidden="true">·</span>
              <span>{mission.difficulty}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 tabular-nums">
                <Clock className="h-3 w-3" />
                {mission.estimatedMinutes} mins
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">{mission.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Narrative Atmospheric Intro */}
          {!submissionResult && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-sm text-slate-300 italic leading-relaxed">
              "{mission.narrativeIntro}"
            </div>
          )}

          {/* Submission Feedback Result Screen */}
          {submissionResult ? (
            <div className="space-y-6">
              {submissionResult.passed ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 text-center space-y-2">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Mission Complete!</h3>
                  <p className="text-sm text-slate-300">
                    Outstanding problem solving! You demonstrated subject mastery with{' '}
                    <span className="font-semibold text-amber-400 tabular-nums">
                      {submissionResult.accuracy}% accuracy
                    </span>.
                  </p>
                  <div className="flex items-center justify-center gap-6 pt-3 text-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2">
                      <div className="text-xs text-slate-400">XP Gained</div>
                      <div className="text-lg font-bold text-amber-400 tabular-nums font-mono">
                        +{submissionResult.awardedXp} XP
                      </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2">
                      <div className="text-xs text-slate-400">School Points</div>
                      <div className="text-lg font-bold text-emerald-400 tabular-nums font-mono">
                        +{submissionResult.awardedPoints} Points
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-5 text-center space-y-2">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                    <AlertCircle className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Review Needed</h3>
                  <p className="text-sm text-slate-300">
                    You scored{' '}
                    <span className="font-semibold text-rose-400 tabular-nums">
                      {submissionResult.accuracy}%
                    </span>. A score of 50% or higher is required to clear this challenge. Review the educational explanations below.
                  </p>
                </div>
              )}

              {/* Step-by-Step Educational Review */}
              <div className="space-y-4 pt-2">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Step-by-Step Educational Explanations
                </h4>
                {submissionResult.results.map((res: any, idx: number) => (
                  <div
                    key={res.questionId}
                    className={`p-4 rounded-xl border text-sm space-y-2 ${
                      res.isCorrect
                        ? 'bg-slate-950/50 border-emerald-500/30 text-slate-200'
                        : 'bg-slate-950/50 border-rose-500/30 text-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-white">
                        Question {idx + 1}: {res.prompt}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${res.isCorrect ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                        {res.isCorrect ? 'Correct' : 'Needs Review'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400">
                      Your answer: <span className={res.isCorrect ? 'text-emerald-300' : 'text-rose-300 line-through'}>{res.studentAnswer || '(No answer)'}</span>
                      {!res.isCorrect && (
                        <> · Correct: <span className="text-emerald-300 font-semibold">{res.correctAnswer}</span></>
                      )}
                    </div>

                    <div className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                      <span className="font-semibold text-amber-400">Teacher's Explanation: </span>
                      {res.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Active Question Solver */
            currentQ && (
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Question <span className="text-white font-semibold tabular-nums">{currentQuestionIndex + 1}</span> of{' '}
                    <span className="tabular-nums">{questions.length}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    {questions.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-6 rounded-full transition-colors ${
                          i === currentQuestionIndex
                            ? 'bg-amber-400'
                            : selectedAnswers[questions[i].id]
                            ? 'bg-emerald-500/60'
                            : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Problem Prompt */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="text-base font-semibold text-white leading-relaxed">
                    {currentQ.prompt}
                  </div>
                  {currentQ.contextText && (
                    <div className="text-xs text-slate-400 font-mono bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                      {currentQ.contextText}
                    </div>
                  )}
                </div>

                {/* Answer Options */}
                <div className="space-y-2.5">
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Select the correct answer:
                  </div>
                  {currentQ.options.map((opt: string) => {
                    const isSelected = selectedAnswers[currentQ.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleSelectOption(opt)}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-white shadow-sm'
                            : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <span>{opt}</span>
                        <div
                          className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-slate-950" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {errorMsg && (
                  <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
                    {errorMsg}
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-800 px-6 py-4 bg-slate-950/40 flex items-center justify-between">
          {submissionResult ? (
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              Continue Exploring Campus
            </button>
          ) : (
            <>
              <button
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition-colors"
              >
                Previous
              </button>

              <div className="flex items-center gap-3">
                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    Next Question
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    {isSubmitting ? 'Evaluating...' : 'Submit Answers'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Swords, Trophy, Clock, CheckCircle2, XCircle, Sparkles, Award } from 'lucide-react';
import { api } from '../lib/api.ts';
import { CampusPlayer } from '../types/index.ts';

interface AcademicDuelModalProps {
  opponent: CampusPlayer;
  onClose: () => void;
  onDuelCompleted?: (awardedXp: number, awardedPoints: number) => void;
}

export const AcademicDuelModal: React.FC<AcademicDuelModalProps> = ({
  opponent,
  onClose,
  onDuelCompleted,
}) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(15);
  const [isFinished, setIsFinished] = useState(false);
  const [duelResult, setDuelResult] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    api
      .getDuelQuestions(opponent.studentId)
      .then((data) => {
        if (mounted) {
          setQuestions(data.questions || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [opponent.studentId]);

  // Per-question countdown timer
  useEffect(() => {
    if (loading || showFeedback || isFinished) return;
    if (timer <= 0) {
      handleAnswer(''); // Auto-timeout
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, loading, showFeedback, isFinished]);

  const handleAnswer = (choice: string) => {
    if (showFeedback) return;
    setSelectedAnswer(choice);
    const currQ = questions[currentIdx];
    const correct = choice === currQ?.correctAnswer;
    setIsCorrect(correct);
    if (correct) {
      setScore((s) => s + 1);
    }
    setShowFeedback(true);
  };

  const handleNext = async () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    setTimer(15);

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
    } else {
      // Duel finished! Submit score
      const finalScore = isCorrect ? score : score; // already updated
      try {
        const res = await api.submitDuel(opponent.studentId, finalScore, questions.length);
        setDuelResult(res);
        onDuelCompleted?.(res.awardedXp, res.awardedPoints);
      } catch (e) {
        setDuelResult({ isWinner: finalScore >= 2, awardedXp: 30, awardedPoints: 10 });
      }
      setIsFinished(true);
    }
  };

  const currentQ = questions[currentIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rose-500/20 via-amber-500/20 to-indigo-500/20 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-rose-400 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Academic Face-Off Duel
              </h3>
              <p className="text-[10px] text-slate-400">
                Challenging {opponent.displayName || opponent.username} (Lv{opponent.level})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 text-center">
              <div className="h-8 w-8 rounded-full border-2 border-rose-400 border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-400">Drafting curriculum challenge questions...</p>
            </div>
          ) : isFinished ? (
            <div className="text-center py-6 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-400/10 border-2 border-amber-400/40 flex items-center justify-center text-3xl shadow-xl">
                {duelResult?.isWinner ? '🏆' : '🤝'}
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">
                  {duelResult?.isWinner ? 'Victory! Academic Champion!' : 'Hard Fought Duel!'}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  You answered {score} out of {questions.length} questions correctly.
                </p>
              </div>

              {/* Reward pill */}
              <div className="flex items-center justify-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 font-bold text-xs flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> +{duelResult?.awardedXp || 40} XP
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-sky-400/10 border border-sky-400/30 text-sky-300 font-bold text-xs flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" /> +{duelResult?.awardedPoints || 15} School Pts
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
              >
                Return to Campus World
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Question progress and timer */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-400">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <div
                  className={`flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-md border ${
                    timer <= 5
                      ? 'border-rose-500 bg-rose-500/10 text-rose-400 animate-pulse'
                      : 'border-slate-800 bg-slate-800 text-slate-300'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" /> {timer}s
                </div>
              </div>

              {/* Question prompt */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 block mb-1">
                  {currentQ?.missionTitle || 'Speed Challenge'}
                </span>
                <p className="text-sm font-semibold text-white leading-relaxed">
                  {currentQ?.prompt}
                </p>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-2 pt-2">
                {currentQ?.options?.map((opt: string, idx: number) => {
                  let btnStyle = 'border-slate-800 bg-slate-800/40 text-slate-200 hover:border-slate-700';

                  if (showFeedback) {
                    if (opt === currentQ.correctAnswer) {
                      btnStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold';
                    } else if (opt === selectedAnswer) {
                      btnStyle = 'border-rose-500 bg-rose-500/20 text-rose-300';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(opt)}
                      disabled={showFeedback}
                      className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {showFeedback && opt === currentQ.correctAnswer && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      )}
                      {showFeedback && opt === selectedAnswer && opt !== currentQ.correctAnswer && (
                        <XCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation & Next */}
              {showFeedback && (
                <div className="pt-2 space-y-3 animate-in fade-in duration-150">
                  <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="font-bold text-amber-400">Insight: </span>
                    {currentQ?.explanation}
                  </p>
                  <button
                    onClick={handleNext}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20"
                  >
                    {currentIdx + 1 < questions.length ? 'Next Question →' : 'View Duel Outcome →'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

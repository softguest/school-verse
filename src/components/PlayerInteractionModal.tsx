import React, { useEffect, useState } from 'react';
import {
  X,
  UserCheck,
  UserPlus,
  MessageSquare,
  Trophy,
  Flame,
  Award,
  Sparkles,
  School,
  GraduationCap,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { CampusPlayer, Student } from '../types/index.ts';
import { api } from '../lib/api.ts';

interface PlayerInteractionModalProps {
  player: CampusPlayer;
  currentStudent: Student;
  onClose: () => void;
  onOpenChatWithMate: (mateStudentId: string) => void;
  onStartDuel?: (player: CampusPlayer) => void;
}

export const PlayerInteractionModal: React.FC<PlayerInteractionModalProps> = ({
  player,
  currentStudent,
  onClose,
  onOpenChatWithMate,
  onStartDuel,
}) => {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    api
      .getStudentPublicCard(player.studentId)
      .then((data) => {
        if (isMounted) {
          setProfile(data);
          setRequestSent(Boolean(data.hasPendingRequest));
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load student public card:', err);
        if (isMounted) {
          setErrorMsg('Could not load student profile.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [player.studentId]);

  const handleSendMateRequest = async () => {
    if (sendingRequest || requestSent) return;
    setSendingRequest(true);
    try {
      await api.sendMateRequest(player.studentId);
      setRequestSent(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to send Mate Over request.');
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Ribbon */}
        <div className="h-20 bg-gradient-to-r from-amber-500/20 via-sky-500/20 to-indigo-500/20 border-b border-slate-800 p-4 flex items-start justify-between relative">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-amber-400/30">
            Campus Peer Encounter
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-0 relative">
          {/* Avatar overlap */}
          <div className="-mt-10 flex items-end justify-between mb-4">
            <div className="h-20 w-20 rounded-2xl bg-slate-800 border-4 border-slate-900 flex items-center justify-center text-3xl font-extrabold text-amber-400 shadow-xl">
              {profile?.avatar || player.displayName?.charAt(0) || 'S'}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs font-semibold text-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Online on Campus</span>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center">
              <div className="h-6 w-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading student badge...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {profile?.displayName || player.displayName}
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    Lv{profile?.level || player.level}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  @{profile?.username || player.username} · {profile?.grade || 'High School Scholar'}
                </p>
                <p className="text-xs text-amber-400/90 flex items-center gap-1 mt-1 font-medium">
                  <School className="h-3.5 w-3.5" />
                  {profile?.school_name || player.schoolCode || 'School'}
                </p>
              </div>

              {profile?.bio && (
                <p className="text-xs text-slate-300 bg-slate-800/40 p-3 rounded-xl border border-slate-800 leading-relaxed italic">
                  "{profile.bio}"
                </p>
              )}

              {/* Stats Highlights */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800">
                  <div className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {profile?.xp || 0}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    Total XP
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800">
                  <div className="text-xs font-bold text-sky-400 flex items-center justify-center gap-1">
                    <Award className="h-3 w-3" />
                    {profile?.school_points || 0}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    School Pts
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800">
                  <div className="text-xs font-bold text-rose-400 flex items-center justify-center gap-1">
                    <Flame className="h-3 w-3" />
                    {profile?.streak || 1}d
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    Streak
                  </span>
                </div>
              </div>

              {/* Badges preview */}
              {profile?.badges && profile.badges.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-amber-400" /> Unlocked Badges
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.badges.slice(0, 4).map((badge: any) => (
                      <span
                        key={badge.id}
                        className="text-[11px] px-2 py-0.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-300 font-medium"
                      >
                        {badge.icon} {badge.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {errorMsg && (
                <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 p-2 rounded-lg">
                  {errorMsg}
                </p>
              )}

              {/* Actions */}
              <div className="pt-2 flex flex-col gap-2">
                {/* Academic Duel Challenge Button */}
                <button
                  onClick={() => {
                    onClose();
                    onStartDuel?.(player);
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-500/20 active:scale-[0.98]"
                >
                  <span className="text-sm">⚔️</span>
                  Challenge to Academic Duel
                </button>

                {profile?.isMate ? (
                  <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400">
                    <UserCheck className="h-4 w-4" /> You are Study Mates!
                  </div>
                ) : requestSent ? (
                  <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-center justify-center gap-2 text-xs font-semibold text-amber-400">
                    <Clock className="h-4 w-4" /> Mate Over Request Pending
                  </div>
                ) : (
                  <button
                    onClick={handleSendMateRequest}
                    disabled={sendingRequest}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
                  >
                    <UserPlus className="h-4 w-4" />
                    {sendingRequest ? 'Sending Request...' : 'Send Mate Over Request'}
                  </button>
                )}

                <button
                  onClick={() => {
                    onClose();
                    onOpenChatWithMate(player.studentId);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageSquare className="h-4 w-4 text-sky-400" />
                  Start Private Study Chat
                </button>

                {/* Safety reporting and blocking */}
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <button
                    onClick={async () => {
                      if (confirm(`Block ${player.displayName}? You will no longer receive chats or duel invites from this student.`)) {
                        await api.blockStudent(player.studentId);
                        alert(`Blocked ${player.displayName}.`);
                        onClose();
                      }
                    }}
                    className="hover:text-rose-400 transition-colors"
                  >
                    Block Scholar
                  </button>
                  <button
                    onClick={async () => {
                      const reason = prompt(`Please enter reason for reporting ${player.displayName}:`);
                      if (reason) {
                        await api.reportStudent(player.studentId, reason);
                        alert('Report submitted to academy faculty.');
                        onClose();
                      }
                    }}
                    className="hover:text-amber-400 transition-colors"
                  >
                    Report Inappropriate Conduct
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

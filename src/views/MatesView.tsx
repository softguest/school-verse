import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  UserPlus,
  Shield,
  Clock,
  Check,
  X,
  Ban,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Student, Mate } from '../types/index.ts';
import { api } from '../lib/api.ts';

interface MatesViewProps {
  student: Student;
  onOpenChatWithMate: (mateId: string) => void;
}

export const MatesView: React.FC<MatesViewProps> = ({ student, onOpenChatWithMate }) => {
  const [mates, setMates] = useState<Mate[]>([]);
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadData = () => {
    api.getMates().then((data) => {
      setMates(data.mates);
      setIncoming(data.incomingRequests);
      setOutgoing(data.outgoingRequests);
      setSuggestions(data.suggestions);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, [student.id]);

  const handleRespond = async (requestId: string, action: 'accept' | 'decline' | 'block') => {
    try {
      const res = await api.respondMateRequest(requestId, action);
      setActionNotice(res.message);
      setTimeout(() => setActionNotice(null), 4000);
      loadData();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    try {
      const res = await api.sendMateRequest(receiverId);
      setActionNotice(res.message);
      setTimeout(() => setActionNotice(null), 4000);
      loadData();
    } catch (err: any) {
      setActionNotice(err.message);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span>🤝 Mate Over System</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
            Study Mates & Academic Peers
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Form bonds with classmates and scholars across Africa to study, compare achievements, and chat securely.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Shield className="h-4 w-4 text-emerald-400" />
          <span>Strict privacy: No phone or email exposure</span>
        </div>
      </div>

      {actionNotice && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs px-4 py-2.5 rounded-xl animate-in fade-in">
          {actionNotice}
        </div>
      )}

      {/* 1. Pending Incoming "Mate Over" Requests */}
      {incoming.length > 0 && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-amber-400">Incoming Mate Over Requests</span>
              <span className="text-xs bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                {incoming.length}
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {incoming.map((req) => (
              <div
                key={req.id}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={req.avatar}
                    alt={req.display_name}
                    className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">{req.display_name}</div>
                    <div className="text-[11px] text-slate-400">
                      {req.school_name} · Level {req.level}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleRespond(req.id, 'accept')}
                    className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg border border-emerald-500/30 transition-colors"
                    title="Accept Mate Over"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRespond(req.id, 'decline')}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg border border-slate-700 transition-colors"
                    title="Decline"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRespond(req.id, 'block')}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30 transition-colors"
                    title="Block"
                  >
                    <Ban className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Current Mates Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">
            Your Confirmed Mates ({mates.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-10 text-xs text-slate-500">Loading mates...</div>
        ) : mates.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
            <UserCheck className="h-8 w-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-white">No Mates yet</h3>
            <p className="text-xs text-slate-400">
              Send a Mate Over request to classmates below to start studying together!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {mates.map((m) => (
              <div
                key={m.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={m.avatar}
                      alt={m.displayName}
                      className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{m.displayName}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                      {m.schoolName}
                    </div>
                    <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                      Level {m.level} · {m.xp.toLocaleString()} XP
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onOpenChatWithMate(m.studentId)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
                  <span>Chat</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Discover Peers (Suggestions) */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Discover Fellow Scholars
          </h2>
          <p className="text-xs text-slate-400">
            Active learners from {student.schoolName} and partner schools.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {suggestions.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={p.avatar}
                  alt={p.display_name}
                  className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="text-xs font-bold text-white">{p.display_name}</div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                    {p.school_name}
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono">
                    Level {p.level} · {p.grade}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSendRequest(p.id)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Mate Over</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

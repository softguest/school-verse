import React, { useEffect, useState, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Shield,
  ShieldAlert,
  Users,
  School,
  Lock,
  Smile,
  AlertCircle,
} from 'lucide-react';
import { Student, ChatRoom, ChatMessage } from '../types/index.ts';
import { api } from '../lib/api.ts';
import { ReportUserModal } from '../components/ReportUserModal.tsx';

interface ChatViewProps {
  student: Student;
  initialRoomId?: string;
}

export const ChatView: React.FC<ChatViewProps> = ({ student, initialRoomId }) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string>(initialRoomId || 'room_lounge');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null);
  const [reportingUser, setReportingUser] = useState<{ id: string; name: string; msgId?: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat rooms
  useEffect(() => {
    api.getChatRooms().then((data) => {
      setRooms(data.rooms);
      if (initialRoomId) {
        setActiveRoomId(initialRoomId);
      } else if (data.rooms.length > 0 && !activeRoomId) {
        setActiveRoomId(data.rooms[0].id);
      }
    });
  }, [student.id, initialRoomId]);

  // Load messages for active room and poll every 4s for fresh messages
  useEffect(() => {
    if (!activeRoomId) return;

    const fetchMessages = () => {
      api.getChatMessages(activeRoomId).then((msgs) => {
        setMessages(msgs);
      });
    };

    fetchMessages();
    const timer = setInterval(fetchMessages, 4000);
    return () => clearInterval(timer);
  }, [activeRoomId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setSafetyNotice(null);
    setIsSending(true);
    const textToSend = newMessage.trim();
    setNewMessage('');

    try {
      const res = await api.sendMessage(activeRoomId, textToSend);
      if (res.flagged && res.moderationNotice) {
        setSafetyNotice(res.moderationNotice);
      }
      setMessages((prev) => [...prev, res.message]);
    } catch (err: any) {
      setSafetyNotice(err.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0];

  return (
    <div className="space-y-4 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Student Lounge & Messaging
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Discuss missions, share study tips, and collaborate safely with verified students.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Shield className="h-4 w-4 text-emerald-400" />
          <span>Automated student safety & anti-harassment active</span>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[650px]">
        
        {/* Left Sidebar: Room List (1/3) */}
        <div className="w-full md:w-72 bg-slate-950/80 border-r border-slate-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Discussion Spaces
          </div>

          <div className="p-2 space-y-1 overflow-y-auto flex-1">
            {rooms.map((room) => {
              const isSelected = room.id === activeRoomId;
              const Icon =
                room.type === 'lounge'
                  ? Users
                  : room.type === 'school'
                  ? School
                  : MessageSquare;

              return (
                <button
                  key={room.id}
                  onClick={() => setActiveRoomId(room.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'bg-amber-500/10 border border-amber-500/40 text-white font-medium'
                      : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-850 text-slate-400'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate text-white">
                      {room.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {room.description || 'Live study exchange'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Area: Active Chat Channel */}
        <div className="flex-1 flex flex-col bg-slate-900/60 min-w-0">
          
          {/* Channel Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {activeRoom?.name || 'Chat Lounge'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {activeRoom?.description || 'Campus student channel'}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Real-time</span>
            </div>
          </div>

          {/* Safety Notice Banner if triggered */}
          {safetyNotice && (
            <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-300 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{safetyNotice}</span>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-16 text-xs text-slate-500">
                No messages yet. Say hello and start the study discussion!
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === student.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 group ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    <img
                      src={msg.sender_avatar}
                      alt={msg.sender_name}
                      className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 shrink-0 object-cover mt-0.5"
                      referrerPolicy="no-referrer"
                    />

                    <div
                      className={`max-w-[75%] space-y-1 ${
                        isMe ? 'items-end text-right' : 'items-start text-left'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1">
                        <span className="font-semibold text-slate-200">{msg.sender_name}</span>
                        <span>·</span>
                        <span className="text-amber-400 font-mono">Lvl {msg.sender_level}</span>
                        <span>·</span>
                        <span className="text-slate-500">{msg.sender_school_code}</span>
                      </div>

                      <div
                        className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          isMe
                            ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                            : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        {msg.content}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-500 px-1">
                        <span>{new Date(msg.created_at || msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {!isMe && (
                          <button
                            onClick={() =>
                              setReportingUser({
                                id: msg.sender_id || msg.senderId || 'unknown',
                                name: msg.sender_name || msg.senderName || 'Student',
                                msgId: msg.id,
                              })
                            }
                            className="opacity-0 group-hover:opacity-100 hover:text-rose-400 text-slate-500 transition-opacity ml-1"
                            title="Report message"
                          >
                            <ShieldAlert className="h-3 w-3 inline" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/60">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message in ${activeRoom?.name || 'chat'}... (Respectful & academic language only)`}
                maxLength={500}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={isSending || !newMessage.trim()}
                className="p-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 rounded-xl transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 shrink-0"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 px-1">
              <span>All communications are filtered for harassment and student privacy.</span>
              <span className="tabular-nums font-mono">{newMessage.length}/500</span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Report Modal */}
      {reportingUser && (
        <ReportUserModal
          reportedStudentId={reportingUser.id}
          reportedStudentName={reportingUser.name}
          messageId={reportingUser.msgId}
          onClose={() => setReportingUser(null)}
        />
      )}
    </div>
  );
};

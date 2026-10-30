import React, { useEffect, useState } from 'react';
import { X, Bell, Check, ExternalLink } from 'lucide-react';
import { NotificationItem } from '../types/index.ts';
import { api } from '../lib/api.ts';

interface NotificationsModalProps {
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  onClose,
  onNavigateTab,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getNotifications().then((data) => {
      setNotifications(data);
      setLoading(false);
    });
  }, []);

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      await api.markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    }
    if (notif.link) {
      const targetTab = notif.link.replace('/', '') || 'dashboard';
      onNavigateTab(targetTab);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Campus Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="text-center py-8 text-sm text-slate-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500">No new notifications</div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`w-full text-left p-3.5 rounded-xl border transition-colors flex items-start gap-3 ${
                  n.isRead
                    ? 'bg-slate-950/30 border-slate-850 hover:border-slate-750 text-slate-400'
                    : 'bg-slate-950/80 border-amber-500/30 hover:border-amber-500/60 text-slate-200'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  <div className={`h-2.5 w-2.5 rounded-full ${n.isRead ? 'bg-slate-700' : 'bg-amber-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{n.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.message}</div>
                  <div className="text-[10px] text-slate-500 mt-1.5">{n.createdAt}</div>
                </div>
                {n.link && <ExternalLink className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-1" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

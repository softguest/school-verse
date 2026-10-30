import React from 'react';
import { Home, School, BookOpen, Trophy, UserCheck, MessageSquare, User } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, unreadCount = 0 }) => {
  const items = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'campus', label: 'Campus', icon: School },
    { id: 'missions', label: 'Missions', icon: BookOpen },
    { id: 'leaderboard', label: 'Ranks', icon: Trophy },
    { id: 'mates', label: 'Mates', icon: UserCheck },
    { id: 'chat', label: 'Chat', icon: MessageSquare, hasBadge: unreadCount > 0 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-md px-1 py-1 max-h-[12vh]"
    >
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-1 py-1 rounded-lg text-[10px] font-medium transition-colors relative ${
                isActive
                  ? 'text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
                {item.hasBadge && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-500" />
                )}
              </div>
              <span className="truncate mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

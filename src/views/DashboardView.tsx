import React, { useEffect, useState } from 'react';
import {
  Flame,
  Trophy,
  BookOpen,
  Users,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Swords,
  Clock,
  Heart,
  ChevronRight,
  Compass,
  Gamepad2,
} from 'lucide-react';
import { Student, Mission, Competition, SocialPost } from '../types/index.ts';
import { api } from '../lib/api.ts';

interface DashboardViewProps {
  student: Student & { levelProgress: any; badges: any[]; matesCount: number };
  onNavigateTab: (tab: string) => void;
  onOpenMission: (missionId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  student,
  onNavigateTab,
  onOpenMission,
}) => {
  const [atmosphere, setAtmosphere] = useState<any>(null);
  const [dailyMissions, setDailyMissions] = useState<Mission[]>([]);
  const [feed, setFeed] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAtmosphere(),
      api.getMissions(),
      api.getFeed(),
    ]).then(([atmoData, missionsData, feedData]) => {
      setAtmosphere(atmoData);
      setDailyMissions(missionsData.slice(0, 3));
      setFeed(feedData.slice(0, 4));
      setLoading(false);
    });
  }, [student.id]);

  const handleLikePost = async (postId: string) => {
    try {
      const res = await api.reactFeed(postId);
      setFeed((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, likesCount: res.likesCount, hasLiked: true } : p
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const progress = student.levelProgress || {
    xpIntoLevel: 420,
    xpNeededForLevel: 1000,
    percentage: 42,
    xpRemaining: 580,
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* 1. Student Status KPI Strip */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* Identity & Greeting */}
          <div className="flex items-center gap-4">
            <img
              src={student.avatar}
              alt={student.displayName}
              className="h-14 w-14 rounded-2xl bg-slate-800 border-2 border-amber-500/40 object-cover shadow-md"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="text-xs text-slate-400">
                Welcome back to campus
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {student.displayName}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="text-slate-300 font-medium">{student.schoolName}</span>
                <span aria-hidden="true">·</span>
                <span>{student.grade}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
            
            {/* Streak */}
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                Streak
              </div>
              <div className="text-base font-bold text-white tabular-nums mt-0.5">
                {student.streak} Days
              </div>
            </div>

            {/* School Points */}
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <Trophy className="h-3.5 w-3.5 text-emerald-400" />
                School Points
              </div>
              <div className="text-base font-bold text-emerald-400 font-mono tabular-nums mt-0.5">
                {student.schoolPoints}
              </div>
            </div>

            {/* School Rank */}
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl px-4 py-2.5">
              <div className="text-xs text-slate-400 font-medium">School Rank</div>
              <div className="text-base font-bold text-white tabular-nums mt-0.5">
                #{student.rankSchool || 1}
              </div>
            </div>

            {/* National Rank */}
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl px-4 py-2.5">
              <div className="text-xs text-slate-400 font-medium">National Rank</div>
              <div className="text-base font-bold text-amber-400 tabular-nums mt-0.5">
                #{student.rankGlobal || 2}
              </div>
            </div>

          </div>
        </div>

        {/* Level & XP Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white">
              Level {student.level} Scholar
            </span>
            <span className="text-slate-400 font-mono tabular-nums">
              {progress.xpIntoLevel.toLocaleString()} / {progress.xpNeededForLevel.toLocaleString()} XP{' '}
              <span className="text-slate-500">({progress.xpRemaining} XP to Level {student.level + 1})</span>
            </span>
          </div>
          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Campus Atmosphere Hero Card with First-Person Narrative */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="h-64 sm:h-72 w-full relative">
          <img
            src="/src/assets/images/schoolverse_hero_campus_1793179508333.jpg"
            alt="Virtual Campus Courtyard"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          
          <div className="absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-6 space-y-2">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold tracking-wide uppercase">
              <Compass className="h-4 w-4" />
              <span>{atmosphere?.timeStr || 'Morning — 8:15 AM'}</span>
              <span aria-hidden="true">·</span>
              <span>{student.schoolName}</span>
            </div>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-3xl">
              {atmosphere?.atmosphereText ||
                'You arrive at your school gate. The campus is already alive. Students gather in the courtyard discussing today’s inter-school challenge.'}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigateTab('campus_world')}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-amber-400/20 hover:scale-105 active:scale-95"
              >
                <Gamepad2 className="h-4 w-4" />
                <span>Play 2D Campus RPG</span>
              </button>
              <button
                onClick={() => onNavigateTab('campus')}
                className="px-4 py-2 bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>Campus Overview</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onNavigateTab('missions')}
                className="px-4 py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Today’s Missions ({dailyMissions.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Grid: Missions & Inter-School Battle */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Today's Academic Missions (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Today’s Academic Challenges</h2>
              <p className="text-xs text-slate-400">Complete tasks to earn XP and advance your school’s score.</p>
            </div>
            <button
              onClick={() => onNavigateTab('missions')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {dailyMissions.map((m) => (
              <div
                key={m.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 sm:p-5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-semibold text-amber-400">{m.subjectName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{m.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 tabular-nums">
                      <Clock className="h-3 w-3" />
                      {m.estimatedMinutes} mins
                    </span>
                    {m.isDailyChallenge && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-300 font-semibold">Daily Challenge</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-white">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {m.description}
                  </p>
                </div>

                <div className="flex items-center sm:flex-col items-end gap-3 sm:gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-start pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                  <div className="text-right">
                    <div className="text-xs font-bold text-amber-400 font-mono tabular-nums">
                      +{m.xpReward} XP
                    </div>
                    <div className="text-[11px] text-emerald-400 font-mono tabular-nums">
                      +{m.pointReward} Points
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenMission(m.id)}
                    className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
                  >
                    Start Mission
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Unlocked Opportunities Spotlight */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <GraduationCap className="h-5 w-5" />
                <span>Scholarship & Opportunity Hub</span>
              </div>
              <button
                onClick={() => onNavigateTab('opportunities')}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300"
              >
                Explore Hub →
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Based on your Level {student.level} and Science progress, you have unlocked eligibility for the{' '}
              <span className="font-semibold text-white">National STEM Excellence Scholarship</span> (Full Tuition + Research Stipend).
            </p>
          </div>
        </div>

        {/* Right Column: Inter-School Battle & Social Presence */}
        <div className="space-y-6">
          
          {/* Active Battle Widget */}
          {atmosphere?.activeBattle && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Swords className="h-4 w-4" />
                  <span>National School Battle</span>
                </div>
                <span className="text-[10px] text-rose-400 font-mono bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">
                  {atmosphere.activeBattle.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Subject: {atmosphere.activeBattle.subject_name}
                </p>
              </div>

              {/* Clash meter */}
              <div className="space-y-2 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white truncate max-w-[120px]">
                    {atmosphere.activeBattle.school1_code}
                  </span>
                  <span className="font-mono text-amber-400 tabular-nums font-bold">
                    {atmosphere.activeBattle.school1_points.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="bg-amber-400 h-full"
                    style={{
                      width: `${(atmosphere.activeBattle.school1_points /
                        (atmosphere.activeBattle.school1_points + atmosphere.activeBattle.school2_points)) *
                        100}%`,
                    }}
                  />
                  <div className="bg-emerald-500 h-full flex-1" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 truncate max-w-[120px]">
                    {atmosphere.activeBattle.school2_code}
                  </span>
                  <span className="font-mono text-emerald-400 tabular-nums font-bold">
                    {atmosphere.activeBattle.school2_points.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('leaderboard')}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg transition-colors"
              >
                View National Leaderboard
              </button>
            </div>
          )}

          {/* Schoolmates Online */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Users className="h-4 w-4 text-emerald-400" />
                <span>Schoolmates Online</span>
              </div>
              <button
                onClick={() => onNavigateTab('chat')}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300"
              >
                Lounge →
              </button>
            </div>

            <div className="space-y-2">
              {atmosphere?.schoolmatesOnline?.map((mate: any) => (
                <div
                  key={mate.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 hover:bg-slate-950/70 border border-slate-850"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <img
                        src={mate.avatar}
                        alt={mate.display_name}
                        className="h-8 w-8 rounded-full bg-slate-800"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{mate.display_name}</div>
                      <div className="text-[10px] text-slate-400">Level {mate.level} · {mate.grade}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateTab('chat')}
                    className="text-[11px] font-medium text-amber-400 hover:text-amber-300 px-2 py-1 rounded bg-slate-900 border border-slate-800"
                  >
                    Chat
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Lightweight Academic Feed */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Campus Activity Feed
            </h3>
            <div className="space-y-3">
              {feed.map((post) => (
                <div key={post.id} className="text-xs space-y-1 border-b border-slate-800/60 pb-2.5 last:border-0 last:pb-0">
                  <div className="font-semibold text-slate-200">{post.title}</div>
                  <div className="text-slate-400 leading-relaxed">{post.subtitle}</div>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                    <span>{post.schoolName}</span>
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-1 transition-colors ${
                        post.hasLiked ? 'text-rose-400' : 'hover:text-rose-400'
                      }`}
                    >
                      <Heart className={`h-3 w-3 ${post.hasLiked ? 'fill-rose-400' : ''}`} />
                      <span className="tabular-nums">{post.likesCount}</span>
                    </button>
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

import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { MobileNav } from './components/MobileNav.tsx';
import { DashboardView } from './views/DashboardView.tsx';
import { CampusView } from './views/CampusView.tsx';
import { MissionsView } from './views/MissionsView.tsx';
import { LeaderboardView } from './views/LeaderboardView.tsx';
import { MatesView } from './views/MatesView.tsx';
import { ChatView } from './views/ChatView.tsx';
import { OpportunitiesView } from './views/OpportunitiesView.tsx';
import { AchievementsView } from './views/AchievementsView.tsx';
import { TeacherView } from './views/TeacherView.tsx';
import { ProfileView } from './views/ProfileView.tsx';
import { OnboardingView } from './views/OnboardingView.tsx';
import { MissionSolverModal } from './components/MissionSolverModal.tsx';
import { LevelUpModal } from './components/LevelUpModal.tsx';
import { RosterSwitcherModal } from './components/RosterSwitcherModal.tsx';
import { NotificationsModal } from './components/NotificationsModal.tsx';
import { Student, Mission } from './types/index.ts';
import { api } from './lib/api.ts';
import { CampusWorldView } from './components/CampusWorldView.tsx';

export default function App() {
  const [student, setStudent] = useState<(Student & { levelProgress: any; badges: any[]; matesCount: number }) | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(2);
  const [isTeacherMode, setIsTeacherMode] = useState(false);

  // Modals
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [levelUpNumber, setLevelUpNumber] = useState<number | null>(null);
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [chatTargetRoomId, setChatTargetRoomId] = useState<string | undefined>();
  const [missionsSubjectFilter, setMissionsSubjectFilter] = useState<string | undefined>();

  const loadStudentProfile = async () => {
    try {
      const data = await api.getCurrentStudent();
      setStudent(data);
    } catch (err) {
      console.error('Failed to load student profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentProfile();
  }, []);

  const handleOpenMission = async (missionId: string) => {
    try {
      const missionData = await api.getMissionDetails(missionId);
      setActiveMission(missionData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenMissionBySubject = (subjectCode: string) => {
    setMissionsSubjectFilter(subjectCode);
    setActiveTab('missions');
  };

  const handleMissionCompleted = (result: any) => {
    if (result.student) {
      setStudent(result.student);
    } else {
      loadStudentProfile();
    }
    if (result.leveledUp && result.newLevel) {
      setLevelUpNumber(result.newLevel);
    }
  };

  const handleOpenChatWithMate = (mateStudentId: string) => {
    if (student) {
      const roomId = `room_dm_${[student.id, mateStudentId].sort().join('_')}`;
      setChatTargetRoomId(roomId);
    }
    setActiveTab('chat');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="h-12 w-12 rounded-2xl bg-amber-400 flex items-center justify-center font-bold text-slate-950 animate-pulse text-xl">
          SV
        </div>
        <div className="mt-4 text-xs font-semibold text-slate-400 tracking-wider uppercase">
          Entering SchoolVerse Campus...
        </div>
      </div>
    );
  }

  // If user requested onboarding flow
  if (activeTab === 'onboarding') {
    return (
      <OnboardingView
        onComplete={() => {
          loadStudentProfile();
          setActiveTab('dashboard');
        }}
      />
    );
  }

  // 2D Playable Multiplayer Campus World View
  if (activeTab === 'campus_world' && student) {
    return (
      <>
        <CampusWorldView
          student={student}
          onExit={() => setActiveTab('campus')}
          onOpenMission={handleOpenMission}
          onOpenChatWithMate={handleOpenChatWithMate}
          onNavigateTab={setActiveTab}
        />

        {activeMission && (
          <MissionSolverModal
            mission={activeMission}
            onClose={() => setActiveMission(null)}
            onMissionCompleted={handleMissionCompleted}
          />
        )}

        {levelUpNumber !== null && (
          <LevelUpModal
            newLevel={levelUpNumber}
            onClose={() => setLevelUpNumber(null)}
            onNavigateTab={(tab) => {
              setLevelUpNumber(null);
              setActiveTab(tab);
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/20 selection:text-amber-200">
      
      {/* Top 3-Zone Navigation Header */}
      <Navbar
        student={student}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'missions') setMissionsSubjectFilter(undefined);
          setActiveTab(tab);
        }}
        unreadCount={unreadNotifications}
        onOpenRoster={() => setIsRosterOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        isTeacherMode={isTeacherMode}
        setIsTeacherMode={(val) => {
          setIsTeacherMode(val);
          if (val) setActiveTab('teacher');
          else if (activeTab === 'teacher') setActiveTab('dashboard');
        }}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {student && (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                student={student}
                onNavigateTab={(tab) => {
                  if (tab === 'missions') setMissionsSubjectFilter(undefined);
                  setActiveTab(tab);
                }}
                onOpenMission={handleOpenMission}
              />
            )}

            {activeTab === 'campus' && (
              <CampusView
                student={student}
                onNavigateTab={setActiveTab}
                onOpenMissionBySubject={handleOpenMissionBySubject}
              />
            )}

            {activeTab === 'missions' && (
              <MissionsView
                student={student}
                onOpenMission={handleOpenMission}
                initialSubjectFilter={missionsSubjectFilter}
              />
            )}

            {activeTab === 'leaderboard' && (
              <LeaderboardView student={student} />
            )}

            {activeTab === 'mates' && (
              <MatesView
                student={student}
                onOpenChatWithMate={handleOpenChatWithMate}
              />
            )}

            {activeTab === 'chat' && (
              <ChatView student={student} initialRoomId={chatTargetRoomId} />
            )}

            {activeTab === 'opportunities' && (
              <OpportunitiesView student={student} />
            )}

            {activeTab === 'achievements' && (
              <AchievementsView student={student} />
            )}

            {activeTab === 'teacher' && <TeacherView />}

            {activeTab === 'profile' && (
              <ProfileView
                student={student}
                onProfileUpdated={loadStudentProfile}
                onNavigateTab={setActiveTab}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'missions') setMissionsSubjectFilter(undefined);
          setActiveTab(tab);
        }}
        unreadCount={unreadNotifications}
      />

      {/* Modals */}
      {activeMission && (
        <MissionSolverModal
          mission={activeMission}
          onClose={() => setActiveMission(null)}
          onMissionCompleted={handleMissionCompleted}
        />
      )}

      {levelUpNumber !== null && (
        <LevelUpModal
          newLevel={levelUpNumber}
          onClose={() => setLevelUpNumber(null)}
          onNavigateTab={(tab) => {
            setLevelUpNumber(null);
            setActiveTab(tab);
          }}
        />
      )}

      {isRosterOpen && (
        <RosterSwitcherModal
          onClose={() => setIsRosterOpen(false)}
          onStudentSwitched={loadStudentProfile}
          onLaunchOnboarding={() => setActiveTab('onboarding')}
          isTeacherMode={isTeacherMode}
          setIsTeacherMode={(val) => {
            setIsTeacherMode(val);
            if (val) setActiveTab('teacher');
            else if (activeTab === 'teacher') setActiveTab('dashboard');
          }}
        />
      )}

      {isNotificationsOpen && (
        <NotificationsModal
          onClose={() => setIsNotificationsOpen(false)}
          onNavigateTab={setActiveTab}
        />
      )}
    </div>
  );
}

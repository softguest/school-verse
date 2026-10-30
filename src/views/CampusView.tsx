import React, { useState } from 'react';
import {
  Compass,
  BookOpen,
  Atom,
  Code2,
  Coffee,
  Trophy,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Flame,
  Dumbbell,
  Users,
  Gamepad2,
} from 'lucide-react';
import { Student } from '../types/index.ts';

interface CampusViewProps {
  student: Student;
  onNavigateTab: (tab: string) => void;
  onOpenMissionBySubject: (subjectCode: string) => void;
}

export const CampusView: React.FC<CampusViewProps> = ({
  student,
  onNavigateTab,
  onOpenMissionBySubject,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string>('classroom');

  const locations = [
    {
      id: 'classroom',
      title: 'Academic Classroom',
      subtitle: 'Form 5 & Upper Sixth Lecture Hall',
      icon: BookOpen,
      image: '/src/assets/images/schoolverse_hero_campus_1793179508333.jpg',
      narrative:
        'You hear the class bell chime through the hallway. Mr. Fon stands at the board writing today’s calculus problem. Several classmates review their homework notes.',
      actionLabel: 'Enter Mathematics & Science Class',
      actionHandler: () => onOpenMissionBySubject('MATH'),
      stats: '18 students online · Morning lecture active',
    },
    {
      id: 'library',
      title: 'Academy Library',
      subtitle: 'Quiet Study & Digital Research Pods',
      icon: GraduationCap,
      image: '/src/assets/images/schoolverse_library_hub_1793179508398.jpg',
      narrative:
        'You enter through the glass doors. Floor-to-ceiling wooden bookshelves flank silent study pods. Students from Grade 10 to Grade 12 pore over literature and history anthologies.',
      actionLabel: 'Browse Literary Comprehension',
      actionHandler: () => onOpenMissionBySubject('ENG'),
      stats: 'Literature & Pan-African records available',
    },
    {
      id: 'science_lab',
      title: 'Natural Sciences Laboratory',
      subtitle: 'Cell Biology, Chemistry & Physics Station',
      icon: Atom,
      image: '/src/assets/images/schoolverse_science_lab_1793179509111.jpg',
      narrative:
        'The sharp scent of reagents and clean glassware greets you. Digital microscopes glow under soft cyan lighting. A lab technician prepares test tubes for cell respiration trials.',
      actionLabel: 'Conduct Science Lab Mission',
      actionHandler: () => onOpenMissionBySubject('SCI'),
      stats: 'High-tech apparatus ready',
    },
    {
      id: 'computer_lab',
      title: 'Computer Science Lab',
      subtitle: 'Algorithm Testing & Logic Engines',
      icon: Code2,
      image: '/src/assets/images/schoolverse_science_lab_1793179509111.jpg',
      narrative:
        'Rows of high-resolution monitors illuminate the room. A leaderboard traces sorting algorithms and data structure complexity tests.',
      actionLabel: 'Tackle Coding & Algorithm Challenge',
      actionHandler: () => onOpenMissionBySubject('CS'),
      stats: 'Computational puzzles online',
    },
    {
      id: 'student_lounge',
      title: 'Student Lounge & Common Hall',
      subtitle: 'Community Exchange & Mate Hangout',
      icon: Coffee,
      image: '/src/assets/images/schoolverse_student_lounge_1793179509342.jpg',
      narrative:
        'Energetic conversation echoes through modular seating. Schoolmates exchange mission notes, compare leaderboard shifts, and send Mate Over requests.',
      actionLabel: 'Join Campus Chat & Lounge',
      actionHandler: () => onNavigateTab('chat'),
      stats: 'Live student chat active',
    },
    {
      id: 'hall_of_champions',
      title: 'Hall of Champions',
      subtitle: 'National Leaderboards & Trophies',
      icon: Trophy,
      image: '/src/assets/images/schoolverse_hero_campus_1793179508333.jpg',
      narrative:
        'Polished brass banners commemorate regional and national school champions. Interactive touch screens display real-time school normalized scores and personal rankings.',
      actionLabel: 'Enter Hall of Champions',
      actionHandler: () => onNavigateTab('leaderboard'),
      stats: 'Current rank: #' + (student.rankGlobal || 2),
    },
  ];

  const activeLoc = locations.find((l) => l.id === selectedLocation) || locations[0];

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Compass className="h-4 w-4" />
            <span>Virtual Campus Exploration</span>
            <span aria-hidden="true">·</span>
            <span>{student.schoolName}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
            Where would you like to go, {student.displayName}?
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Campus active · 24 students online</span>
        </div>
      </div>

      {/* 2D PLAYABLE MULTIPLAYER CAMPUS LAUNCH HERO */}
      <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-mono font-bold flex items-center gap-1.5">
                <Gamepad2 className="h-3.5 w-3.5" /> PHASE 2: 2D MULTIPLAYER RPG CAMPUS
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 text-[10px] font-semibold">
                Live Realtime
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Enter {student.schoolName} Virtual 2D Campus
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Step directly into a top-down pixel-art world. Walk through the security gate into the
              central courtyard, enter 12 interactive classroom facilities, encounter schoolmates
              moving in real-time, send speech bubbles, and tackle subject missions right from your
              desk!
            </p>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <button
              onClick={() => onNavigateTab('campus_world')}
              className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <Gamepad2 className="h-5 w-5" />
              <span>LAUNCH 2D CAMPUS WORLD</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <div className="mt-2 text-center text-[10px] text-slate-400">
              Desktop: WASD/Arrows · Mobile: Virtual Joystick
            </div>
          </div>
        </div>
      </div>

      {/* Main Focus View on Selected Location */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Interactive Location List (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Available Campus Zones
          </div>

          <div className="space-y-2">
            {locations.map((loc) => {
              const Icon = loc.icon;
              const isSelected = selectedLocation === loc.id;
              return (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-white leading-tight">
                        {loc.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[220px]">
                        {loc.subtitle}
                      </div>
                    </div>
                  </div>

                  <ArrowRight
                    className={`h-4 w-4 shrink-0 transition-transform ${
                      isSelected ? 'text-amber-400 translate-x-1' : 'text-slate-600'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Narrative Experience & Action Area (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          
          {/* Location Visual */}
          <div className="h-64 sm:h-72 w-full relative">
            <img
              src={activeLoc.image}
              alt={activeLoc.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
            
            <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-sm border border-slate-800 px-3 py-1 rounded-lg text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <activeLoc.icon className="h-3.5 w-3.5" />
              <span>{activeLoc.title}</span>
            </div>

            <div className="absolute bottom-4 left-4 right-4 text-xs text-slate-300 font-medium">
              {activeLoc.stats}
            </div>
          </div>

          {/* First-Person Narrative Text */}
          <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                First-Person Atmospheric Scene
              </div>

              <blockquote className="border-l-2 border-amber-400 pl-4 py-1 text-sm sm:text-base text-slate-200 italic leading-relaxed bg-slate-950/40 rounded-r-xl pr-3">
                "{activeLoc.narrative}"
              </blockquote>

              <p className="text-xs text-slate-400 leading-relaxed">
                Step inside to solve academic missions, consult learning materials, or interact with peers. All accomplishments directly grant XP and elevate your school's standing.
              </p>
            </div>

            {/* Action Trigger */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                Active Zone: <span className="text-white font-medium">{activeLoc.title}</span>
              </div>
              <button
                onClick={activeLoc.actionHandler}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
              >
                <span>{activeLoc.actionLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

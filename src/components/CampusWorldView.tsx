import React, { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import {
  ArrowLeft,
  Users,
  Compass,
  MessageSquare,
  HelpCircle,
  Map as MapIcon,
  Send,
  Sparkles,
  Shirt,
  Swords,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { MainCampusScene } from '../game/MainCampusScene.ts';
import { CampusRealtimeClient } from '../lib/realtime.ts';
import { api } from '../lib/api.ts';
import { CampusBuilding, CampusPlayer, CampusMoveEvent, Student } from '../types/index.ts';
import { ClassroomModal } from './ClassroomModal.tsx';
import { PlayerInteractionModal } from './PlayerInteractionModal.tsx';
import { CharacterCustomizerModal } from './CharacterCustomizerModal.tsx';
import { AcademicDuelModal } from './AcademicDuelModal.tsx';

interface CampusWorldViewProps {
  student: Student & { levelProgress?: any; badges?: any[]; matesCount?: number; customization?: any };
  onExit: () => void;
  onOpenMission: (missionId: string) => void;
  onOpenChatWithMate: (mateStudentId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const CampusWorldView: React.FC<CampusWorldViewProps> = ({
  student,
  onExit,
  onOpenMission,
  onOpenChatWithMate,
  onNavigateTab,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<MainCampusScene | null>(null);
  const realtimeRef = useRef<CampusRealtimeClient | null>(null);

  const [loading, setLoading] = useState(true);
  const [worldData, setWorldData] = useState<any>(null);
  const [currentZone, setCurrentZone] = useState<string>('Central Courtyard & Monument');
  const [playerPos, setPlayerPos] = useState({ x: 960, y: 1216 });
  const [nearbyBuilding, setNearbyBuilding] = useState<CampusBuilding | null>(null);
  const [nearbyPlayer, setNearbyPlayer] = useState<CampusPlayer | null>(null);
  const [onlinePeers, setOnlinePeers] = useState<CampusPlayer[]>([]);

  // Modals inside World
  const [activeBuildingModal, setActiveBuildingModal] = useState<CampusBuilding | null>(null);
  const [activePlayerModal, setActivePlayerModal] = useState<CampusPlayer | null>(null);
  const [isWardrobeOpen, setIsWardrobeOpen] = useState(false);
  const [activeDuelOpponent, setActiveDuelOpponent] = useState<CampusPlayer | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMinimapOpen, setIsMinimapOpen] = useState(true);

  // Discovery banner pop-up
  const [discoveryBanner, setDiscoveryBanner] = useState<{ zoneName: string; xp: number } | null>(null);

  // Chat speech bubble input
  const [chatInput, setChatInput] = useState('');

  // Mobile joystick touch tracking
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const joystickKnobRef = useRef<HTMLDivElement>(null);
  const touchStateRef = useRef<{ touchId: number | null; startX: number; startY: number }>({
    touchId: null,
    startX: 0,
    startY: 0,
  });

  // 1. Fetch Campus Data & Init Game
  useEffect(() => {
    let isCancelled = false;
    const schoolId = student.schoolId || (student as any).school_id || 'sch_bgs_buea';

    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setIsTouchDevice(true);
    }

    api
      .getCampusWorld(schoolId)
      .then((data) => {
        if (isCancelled) return;
        setWorldData(data);

        // Record initial exploration milestone award
        api.recordExplorationEvent('first_exploration').catch(() => {});

        // Initialize Realtime WebSocket / Supabase connection
        const realtimeClient = new CampusRealtimeClient({
          onRoomState: (players: CampusPlayer[]) => {
            sceneRef.current?.syncAllRemotePlayers(players);
            setOnlinePeers(players);
          },
          onPlayerJoined: (peer: CampusPlayer) => {
            sceneRef.current?.addRemotePlayer(peer);
            setOnlinePeers((prev) => [...prev.filter((p) => p.studentId !== peer.studentId), peer]);
          },
          onPlayerMoved: (moveEvent: CampusMoveEvent) => {
            sceneRef.current?.syncRemotePlayerMove(moveEvent);
          },
          onPlayerLeft: (peerStudentId: string) => {
            sceneRef.current?.removeRemotePlayer(peerStudentId);
            setOnlinePeers((prev) => prev.filter((p) => p.studentId !== peerStudentId));
          },
          onChatBubble: (chatEvent: { studentId: string; displayName: string; message: string }) => {
            sceneRef.current?.displaySpeechBubble(chatEvent.studentId, chatEvent.message);
          },
        });

        realtimeRef.current = realtimeClient;
        realtimeClient.connect(student, schoolId);

        // Instantiate Phaser Scene with callbacks
        const campusScene = new MainCampusScene({
          schoolId: data.schoolId,
          schoolName: data.schoolName,
          schoolCode: data.schoolCode,
          mapWidth: data.mapWidth || 60,
          mapHeight: data.mapHeight || 45,
          tileSize: data.tileSize || 32,
          spawnX: data.spawnX || 960,
          spawnY: data.spawnY || 1216,
          buildings: data.buildings || [],
          currentStudent: student,
          onNearbyBuildingChange: (building) => {
            setNearbyBuilding(building);
          },
          onNearbyPlayerChange: (peer) => {
            setNearbyPlayer(peer);
          },
          onEnterBuilding: (building) => {
            setActiveBuildingModal(building);
          },
          onLocationChange: (zoneName) => {
            setCurrentZone(zoneName);
          },
          onZoneDiscovered: (zoneName) => {
            const zoneId = zoneName.toLowerCase().replace(/[^a-z0-9]/g, '_');
            api
              .discoverZone(zoneId, zoneName)
              .then((res) => {
                if (res.isFirstDiscovery) {
                  setDiscoveryBanner({ zoneName, xp: res.awardedXp });
                  setTimeout(() => setDiscoveryBanner(null), 4500);
                }
              })
              .catch(() => {});
          },
          onPlayerMoveBroadcast: (x, y, dir, isMoving, zone) => {
            setPlayerPos({ x, y });
            realtimeClient.sendMovement(x, y, dir, isMoving, zone);
          },
        });

        sceneRef.current = campusScene;

        // Phaser Game Configuration
        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          parent: containerRef.current || undefined,
          backgroundColor: '#0a0f1d',
          pixelArt: true,
          roundPixels: true,
          scale: {
            mode: Phaser.Scale.RESIZE,
            width: '100%',
            height: '100%',
          },
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { x: 0, y: 0 },
              debug: false,
            },
          },
          scene: [campusScene],
        };

        const game = new Phaser.Game(config);
        gameRef.current = game;
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load campus world:', err);
        setLoading(false);
      });

    return () => {
      isCancelled = true;
      if (realtimeRef.current) {
        realtimeRef.current.disconnect();
        realtimeRef.current = null;
      }
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      sceneRef.current = null;
    };
  }, [student.schoolId, student.id]);

  // Handle Speech Bubble send
  const handleSendSpeech = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !realtimeRef.current) return;
    const msg = chatInput.trim();
    realtimeRef.current.sendChatBubble(msg);
    sceneRef.current?.displaySpeechBubble(student.id, msg);
    setChatInput('');
  };

  const handleQuickEmote = (text: string) => {
    if (!realtimeRef.current) return;
    realtimeRef.current.sendChatBubble(text);
    sceneRef.current?.displaySpeechBubble(student.id, text);
  };

  // Mobile Touch Virtual Joystick handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (touchStateRef.current.touchId !== null) return;
    const touch = e.changedTouches[0];
    touchStateRef.current = {
      touchId: touch.identifier,
      startX: touch.clientX,
      startY: touch.clientY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStateRef.current.touchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchStateRef.current.touchId) {
        const dx = touch.clientX - touchStateRef.current.startX;
        const dy = touch.clientY - touchStateRef.current.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 45;

        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);
        const knobX = Math.cos(angle) * clampedDist;
        const knobY = Math.sin(angle) * clampedDist;

        if (joystickKnobRef.current) {
          joystickKnobRef.current.style.transform = `translate(${knobX}px, ${knobY}px)`;
        }

        const normX = clampedDist > 5 ? knobX / maxDist : 0;
        const normY = clampedDist > 5 ? knobY / maxDist : 0;
        sceneRef.current?.setMobileJoystick(normX, normY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchStateRef.current.touchId) {
        touchStateRef.current.touchId = null;
        if (joystickKnobRef.current) {
          joystickKnobRef.current.style.transform = `translate(0px, 0px)`;
        }
        sceneRef.current?.setMobileJoystick(0, 0);
        break;
      }
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* 1. TOP GAME HUD */}
      <header className="relative z-20 h-14 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 flex items-center justify-between">
        {/* Left: Exit & Student Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700/60 shadow-sm hover:scale-[1.02]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Exit Campus</span>
          </button>

          <div className="h-4 w-px bg-slate-700/60 hidden sm:block" />

          {/* Player Mini Badge */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-slate-800 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400 text-sm shadow-inner">
              {student.avatar || student.displayName?.charAt(0) || 'S'}
            </div>
            <div className="hidden md:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white leading-none">
                  {student.displayName}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold">
                  Lv{student.level}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${student.levelProgress?.progressPercent || 45}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {student.xp} XP
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Current Campus Zone Tag */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-950/70 border border-slate-800 text-xs text-amber-300/90 shadow-inner">
          <Compass className="h-3.5 w-3.5 text-amber-400 animate-spin-slow" />
          <span className="font-semibold">{currentZone}</span>
        </div>

        {/* Right: Wardrobe, Live Count, Minimap Toggle & Controls Help */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Wardrobe / Style Customizer Button */}
          <button
            onClick={() => setIsWardrobeOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-sky-500/20 hover:from-amber-500/30 hover:to-sky-500/30 border border-amber-400/30 text-amber-300 text-xs font-semibold transition-all shadow-sm active:scale-95"
            title="Open Wardrobe & Appearance Customizer"
          >
            <Shirt className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Wardrobe & Style</span>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-[11px] font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{onlinePeers.length + 1} online</span>
          </div>

          <button
            onClick={() => setIsMinimapOpen(!isMinimapOpen)}
            className={`p-2 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1 ${
              isMinimapOpen
                ? 'bg-slate-800 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle Minimap Radar"
          >
            <MapIcon className="h-4 w-4" />
          </button>

          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Campus Controls Help"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN PHASER VIEWPORT CONTAINER */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-slate-950">
        <div ref={containerRef} className="w-full h-full" />

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-400 flex items-center justify-center font-bold text-slate-950 text-xl animate-pulse">
              SV
            </div>
            <p className="mt-4 text-xs font-semibold text-slate-300 uppercase tracking-widest">
              Connecting to Virtual Campus World...
            </p>
          </div>
        )}

        {/* Floating Discovery Banner Overlay */}
        {discoveryBanner && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-top-4 duration-300">
            <div className="px-5 py-3 rounded-2xl bg-slate-950/90 border-2 border-amber-400/80 shadow-2xl shadow-amber-500/30 flex items-center gap-3 backdrop-blur-md">
              <div className="h-9 w-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 text-lg">
                ✨
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 block">
                  Location Discovered
                </span>
                <h4 className="text-sm font-black text-white">{discoveryBanner.zoneName}</h4>
              </div>
              <div className="ml-2 px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-xs shadow-md">
                +{discoveryBanner.xp} XP
              </div>
            </div>
          </div>
        )}

        {/* 3. INTERACTIVE CONTEXT ACTION PROMPTS */}
        {nearbyBuilding && !activeBuildingModal && (
          <div className="absolute bottom-24 sm:bottom-20 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              onClick={() => setActiveBuildingModal(nearbyBuilding)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2.5 shadow-xl shadow-amber-500/25 border border-amber-300/40 transition-all hover:scale-105 active:scale-95"
            >
              <span className="px-1.5 py-0.5 rounded bg-slate-950/25 font-mono text-[11px] font-extrabold uppercase">
                [ E ]
              </span>
              <span>Enter {nearbyBuilding.name}</span>
            </button>
          </div>
        )}

        {nearbyPlayer && !nearbyBuilding && !activePlayerModal && !activeDuelOpponent && (
          <div className="absolute bottom-24 sm:bottom-20 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              onClick={() => setActivePlayerModal(nearbyPlayer)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2.5 shadow-xl shadow-sky-500/25 border border-sky-300/40 transition-all hover:scale-105 active:scale-95"
            >
              <span className="px-1.5 py-0.5 rounded bg-slate-950/25 font-mono text-[11px] font-extrabold uppercase">
                [ E ]
              </span>
              <span>Interact with {nearbyPlayer.displayName || nearbyPlayer.username}</span>
            </button>
          </div>
        )}

        {/* 4. MINIMAP RADAR OVERLAY (Collapsible) */}
        {isMinimapOpen && worldData && (
          <div className="absolute top-4 right-4 z-20 w-44 sm:w-52 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-slate-800 p-2.5 shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                <Compass className="h-3 w-3 text-amber-400" /> Campus Radar
              </span>
              <span className="text-[9px] font-semibold text-slate-500">60x45</span>
            </div>

            {/* Radar Canvas / Scaled Map Projection */}
            <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-xl overflow-hidden border border-slate-800/80">
              {/* Central Courtyard outline */}
              <div
                className="absolute bg-amber-500/15 border border-amber-500/30 rounded"
                style={{
                  left: '37%',
                  top: '48%',
                  width: '26%',
                  height: '26%',
                }}
              />

              {/* Athletic track preview */}
              <div
                className="absolute bg-rose-500/15 border border-rose-500/30 rounded"
                style={{
                  left: '38%',
                  top: '26%',
                  width: '36%',
                  height: '20%',
                }}
              />

              {/* Render Building footprints */}
              {worldData.buildings?.map((b: any) => {
                const mapW = worldData.mapWidth * 32;
                const mapH = worldData.mapHeight * 32;
                const left = (b.x / mapW) * 100;
                const top = (b.y / mapH) * 100;
                const w = (b.width / mapW) * 100;
                const h = (b.height / mapH) * 100;

                return (
                  <div
                    key={b.id}
                    className="absolute bg-slate-800 border border-slate-700 rounded-sm hover:border-amber-400"
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      width: `${w}%`,
                      height: `${h}%`,
                    }}
                    title={b.name}
                  />
                );
              })}

              {/* Remote Players Dots */}
              {onlinePeers.map((p) => {
                const mapW = worldData.mapWidth * 32;
                const mapH = worldData.mapHeight * 32;
                const left = Math.min(95, Math.max(5, (p.x / mapW) * 100));
                const top = Math.min(95, Math.max(5, (p.y / mapH) * 100));

                return (
                  <div
                    key={p.studentId}
                    className="absolute h-1.5 w-1.5 rounded-full bg-sky-400 shadow-sm -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${left}%`, top: `${top}%` }}
                    title={p.displayName}
                  />
                );
              })}

              {/* Local Player Pulse Marker in Yellow */}
              <div
                className="absolute h-2.5 w-2.5 rounded-full bg-amber-400 border border-slate-950 shadow-md shadow-amber-400/50 -translate-x-1/2 -translate-y-1/2 animate-pulse"
                style={{
                  left: `${(playerPos.x / (worldData.mapWidth * 32)) * 100}%`,
                  top: `${(playerPos.y / (worldData.mapHeight * 32)) * 100}%`,
                }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400 px-1">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> You
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" /> Peers
              </span>
            </div>
          </div>
        )}

        {/* 5. MOBILE TOUCH CONTROLS (Virtual Joystick + Action Button) */}
        <div className="sm:hidden absolute inset-x-0 bottom-0 pointer-events-none p-4 flex items-end justify-between z-20">
          <div
            ref={joystickBaseRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="pointer-events-auto h-28 w-28 rounded-full bg-slate-900/70 border-2 border-slate-700/60 backdrop-blur-md flex items-center justify-center relative touch-none shadow-2xl active:border-amber-400/60"
          >
            <div
              ref={joystickKnobRef}
              className="h-12 w-12 rounded-full bg-amber-500/80 border border-amber-300 shadow-md transition-transform duration-75 pointer-events-none flex items-center justify-center"
            >
              <div className="h-4 w-4 rounded-full bg-slate-950/40" />
            </div>
          </div>

          <button
            onTouchStart={(e) => {
              e.preventDefault();
              sceneRef.current?.handleActionTrigger();
            }}
            onClick={() => sceneRef.current?.handleActionTrigger()}
            className="pointer-events-auto h-20 w-20 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm border-2 border-amber-300 shadow-xl shadow-amber-500/30 flex flex-col items-center justify-center active:scale-95 transition-transform"
          >
            <span className="text-base font-black">E</span>
            <span className="text-[9px] font-bold uppercase tracking-wider">ACTION</span>
          </button>
        </div>

        {/* 6. BOTTOM SPEECH BUBBLE QUICK BAR */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-full max-w-xl px-4 pointer-events-auto">
          <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-2 shadow-2xl">
            {/* Quick Emote Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-1 scrollbar-none">
              {[
                '👋 Hello scholars!',
                '📚 Anyone ready for Calculus?',
                '🏆 Let’s win the inter-school battle!',
                '⚔️ Who wants an Academic Duel?',
                '🎒 Meeting at the Central Fountain!',
              ].map((msg, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleQuickEmote(msg)}
                  className="px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium whitespace-nowrap transition-colors border border-slate-700/50"
                >
                  {msg}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendSpeech} className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Say something to schoolmates on campus... (Enter to speak)"
                maxLength={90}
                className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Say</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 7. CONTROLS HELP MODAL */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-amber-400" /> Campus Exploration Controls
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Welcome to the 2D Virtual Campus! You are connected to your school’s private shared
              world in real time.
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
                <span className="text-slate-300 font-semibold">Walk / Navigate</span>
                <span className="font-mono bg-slate-950 px-2 py-0.5 rounded text-amber-300 border border-slate-800">
                  W, A, S, D / Arrow Keys
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
                <span className="text-slate-300 font-semibold">Enter Building / Interact</span>
                <span className="font-mono bg-slate-950 px-2 py-0.5 rounded text-amber-300 border border-slate-800">
                  E or Spacebar
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
                <span className="text-slate-300 font-semibold">Campus Speech Bubble</span>
                <span className="font-mono bg-slate-950 px-2 py-0.5 rounded text-amber-300 border border-slate-800">
                  Enter / Chat Bar
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
                <span className="text-slate-300 font-semibold">Wardrobe Customizer</span>
                <span className="text-slate-400">Click "Wardrobe & Style" in the top bar</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
                <span className="text-slate-300 font-semibold">Mobile Controls</span>
                <span className="text-slate-400">On-screen Virtual Joystick & Action button</span>
              </div>
            </div>

            <button
              onClick={() => setIsHelpOpen(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Got it, Resume Campus
            </button>
          </div>
        </div>
      )}

      {/* 8. CLASSROOM MODAL */}
      {activeBuildingModal && (
        <ClassroomModal
          building={activeBuildingModal}
          student={student}
          onClose={() => setActiveBuildingModal(null)}
          onOpenMission={onOpenMission}
          onOpenChatWithMate={onOpenChatWithMate}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* 9. PLAYER INTERACTION MODAL */}
      {activePlayerModal && (
        <PlayerInteractionModal
          player={activePlayerModal}
          currentStudent={student}
          onClose={() => setActivePlayerModal(null)}
          onOpenChatWithMate={onOpenChatWithMate}
          onStartDuel={(p) => setActiveDuelOpponent(p)}
        />
      )}

      {/* 10. ACADEMIC DUEL MODAL */}
      {activeDuelOpponent && (
        <AcademicDuelModal
          opponent={activeDuelOpponent}
          onClose={() => setActiveDuelOpponent(null)}
          onDuelCompleted={(xp, pts) => {
            if (student) {
              student.xp = (student.xp || 0) + xp;
              student.schoolPoints = (student.schoolPoints || 0) + pts;
            }
          }}
        />
      )}

      {/* 11. WARDROBE & AVATAR CUSTOMIZER MODAL */}
      {isWardrobeOpen && (
        <CharacterCustomizerModal
          initialConfig={student.customization}
          onClose={() => setIsWardrobeOpen(false)}
          onSave={(custom) => {
            student.customization = custom;
            sceneRef.current?.updatePlayerCustomization(custom);
          }}
        />
      )}
    </div>
  );
};

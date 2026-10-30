/**
 * SchoolVerse API Client & State Helpers
 */

import { Student, School, Subject, Mission, Opportunity, Competition, SocialPost, NotificationItem, ChatRoom, ChatMessage, Mate, MateRequest, TeacherAssessment } from '../types/index.ts';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errMsg = 'Request failed';
    try {
      const err = await res.json();
      errMsg = err.error || errMsg;
    } catch {
      errMsg = `${res.status} ${res.statusText}`;
    }
    throw new Error(errMsg);
  }

  return res.json();
}

export const api = {
  // Student & Auth
  getCurrentStudent: () => fetchJson<Student & { levelProgress: any; badges: any[]; matesCount: number }>('/api/student/current'),
  getDemoRoster: () => fetchJson<{ activeStudentId: string; students: any[] }>('/api/students/demo-roster'),
  switchStudent: (studentId: string) => fetchJson<{ success: boolean; activeStudentId: string }>('/api/student/switch', {
    method: 'POST',
    body: JSON.stringify({ studentId }),
  }),
  registerStudent: (data: any) => fetchJson<{ success: boolean; student: any }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateProfile: (data: any) => fetchJson<{ success: boolean; profile: any }>('/api/student/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  // Schools
  getSchools: (query?: string) => fetchJson<School[]>(`/api/schools${query ? `?q=${encodeURIComponent(query)}` : ''}`),
  getSchool: (id: string) => fetchJson<School & { topStudents: any[] }>(`/api/schools/${id}`),

  // Campus & Atmosphere
  getAtmosphere: () => fetchJson<{
    timeStr: string;
    atmosphereText: string;
    schoolName: string;
    schoolCode: string;
    schoolmatesOnline: any[];
    otherSchoolsOnline: any[];
    availableMissionsCount: number;
    unreadNotifs: number;
    activeBattle: any;
  }>('/api/campus/atmosphere'),

  getCampusWorld: (schoolId: string) => fetchJson<{
    schoolId: string;
    schoolName: string;
    schoolCode: string;
    mapWidth: number;
    mapHeight: number;
    tileSize: number;
    spawnX: number;
    spawnY: number;
    buildings: any[];
    currentStudent: any;
  }>(`/api/campus/${schoolId}/world`),

  getBuildingDetails: (buildingId: string) => fetchJson<{
    id: string;
    name: string;
    code: string;
    category: string;
    subjectCode?: string;
    description: string;
    narrativeIntro: string;
    doorLabel: string;
    missions: any[];
    schoolmates: any[];
  }>(`/api/campus/buildings/${buildingId}`),

  getStudentPublicCard: (studentId: string) => fetchJson<any>(`/api/student/public-card/${studentId}`),

  recordExplorationEvent: (eventType: string, buildingCode?: string) => fetchJson<{ success: boolean; awardedXp: number; currentXp: number }>('/api/campus/exploration-event', {
    method: 'POST',
    body: JSON.stringify({ eventType, buildingCode }),
  }),

  // Student Customization
  getCustomization: () => fetchJson<{
    skin_tone: number;
    hair_style: string;
    hair_color: string;
    uniform_style: string;
    accessory: string;
  }>('/api/student/customization'),
  updateCustomization: (data: {
    skin_tone: number;
    hair_style: string;
    hair_color: string;
    uniform_style: string;
    accessory: string;
  }) => fetchJson<{ success: boolean; customization: any }>('/api/student/customization', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Campus Discoveries
  getCampusDiscoveries: () => fetchJson<{ discoveredZones: string[] }>('/api/campus/discoveries'),
  discoverZone: (zoneId: string, zoneName: string) => fetchJson<{
    isFirstDiscovery: boolean;
    awardedXp: number;
    awardedPoints: number;
    totalDiscovered: number;
    zoneName?: string;
  }>('/api/campus/discover-zone', {
    method: 'POST',
    body: JSON.stringify({ zoneId, zoneName }),
  }),

  // Student Safety
  blockStudent: (targetStudentId: string) => fetchJson<{ success: boolean; message: string }>('/api/student/block', {
    method: 'POST',
    body: JSON.stringify({ targetStudentId }),
  }),

  // Academic Quiz Duel
  getDuelQuestions: (opponentId?: string, subjectCode?: string) => fetchJson<{
    questions: Array<{
      id: string;
      prompt: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
      missionTitle?: string;
    }>;
  }>('/api/duel/questions', {
    method: 'POST',
    body: JSON.stringify({ opponentId, subjectCode }),
  }),
  submitDuel: (opponentId: string, score: number, totalQuestions: number) => fetchJson<{
    success: boolean;
    isWinner: boolean;
    awardedXp: number;
    awardedPoints: number;
    score: number;
  }>('/api/duel/submit', {
    method: 'POST',
    body: JSON.stringify({ opponentId, score, totalQuestions }),
  }),

  // Missions
  getSubjects: () => fetchJson<Subject[]>('/api/subjects'),
  getMissions: (subjectId?: string) => fetchJson<Mission[]>(`/api/missions${subjectId ? `?subjectId=${subjectId}` : ''}`),
  getMissionDetails: (id: string) => fetchJson<Mission>('/api/missions/' + id),
  submitMission: (id: string, answers: Record<string, string>) => fetchJson<{
    success: boolean;
    passed: boolean;
    accuracy: number;
    correctCount: number;
    totalQuestions: number;
    awardedXp: number;
    awardedPoints: number;
    leveledUp: boolean;
    newLevel: number;
    newBadgesUnlocked: any[];
    results: any[];
    student: any;
  }>(`/api/missions/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  }),

  // Leaderboards
  getStudentLeaderboard: (scope: string = 'global') => fetchJson<{
    scope: string;
    students: any[];
    currentStudent: { id: string; rank: number; xp: number; level: number; points: number };
  }>(`/api/leaderboard/students?scope=${scope}`),
  getSchoolLeaderboard: () => fetchJson<School[]>('/api/leaderboard/schools'),

  // Mates & Social
  getMates: () => fetchJson<{
    mates: Mate[];
    incomingRequests: any[];
    outgoingRequests: any[];
    suggestions: any[];
  }>('/api/mates'),
  sendMateRequest: (receiverId: string) => fetchJson<{ success: boolean; message: string }>('/api/mates/request', {
    method: 'POST',
    body: JSON.stringify({ receiverId }),
  }),
  respondMateRequest: (requestId: string, action: 'accept' | 'decline' | 'block') => fetchJson<{ success: boolean; message: string }>('/api/mates/respond', {
    method: 'POST',
    body: JSON.stringify({ requestId, action }),
  }),

  // Chat
  getChatRooms: () => fetchJson<{ rooms: ChatRoom[] }>('/api/chat/rooms'),
  getChatMessages: (roomId: string) => fetchJson<ChatMessage[]>(`/api/chat/messages/${roomId}`),
  sendMessage: (roomId: string, content: string) => fetchJson<{
    success: boolean;
    message: ChatMessage;
    flagged: boolean;
    moderationNotice?: string;
  }>('/api/chat/messages', {
    method: 'POST',
    body: JSON.stringify({ roomId, content }),
  }),
  reportStudent: (reportedStudentId: string, reason: string, messageId?: string) => fetchJson<{ success: boolean; message: string }>('/api/chat/report', {
    method: 'POST',
    body: JSON.stringify({ reportedStudentId, reason, messageId }),
  }),

  // Opportunities
  getOpportunities: () => fetchJson<Opportunity[]>('/api/opportunities'),

  // Competitions
  getCompetitions: () => fetchJson<Competition[]>('/api/competitions'),

  // Social feed & Notifications
  getFeed: () => fetchJson<SocialPost[]>('/api/feed'),
  reactFeed: (id: string) => fetchJson<{ success: boolean; likesCount: number }>(`/api/feed/${id}/react`, {
    method: 'POST',
  }),
  getNotifications: () => fetchJson<NotificationItem[]>('/api/notifications'),
  markNotificationRead: (id: string) => fetchJson<{ success: boolean }>(`/api/notifications/${id}/read`, {
    method: 'POST',
  }),

  // Teacher tools
  getTeacherAssessments: () => fetchJson<TeacherAssessment[]>('/api/teacher/assessments'),
  getStudentsProgress: () => fetchJson<any[]>('/api/teacher/students-progress'),
  submitAssessment: (assessmentId: string, answers: Record<number, string>) => fetchJson<{ success: boolean; score: number }>(`/api/teacher/assessments/${assessmentId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  }),
};

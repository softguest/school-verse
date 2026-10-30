/**
 * SchoolVerse Core Type Definitions
 */

export type Role = 'student' | 'teacher' | 'school_admin' | 'super_admin';

export interface User {
  id: string;
  username: string;
  email?: string;
  role: Role;
  createdAt: string;
}

export interface School {
  id: string;
  name: string;
  code: string;
  country: string;
  region: string;
  city: string;
  logo?: string;
  description: string;
  motto: string;
  points: number;
  studentCount: number;
  normalizedScore: number;
  rank?: number;
  createdAt: string;
}

export interface Student {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  avatar: string;
  schoolId: string;
  schoolName?: string;
  schoolCode?: string;
  grade: string;
  region: string;
  country: string;
  level: number;
  xp: number;
  schoolPoints: number;
  streak: number;
  longestStreak: number;
  lastActiveDate: string;
  bio: string;
  interests: string[];
  role: Role;
  rankGlobal?: number;
  rankSchool?: number;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  icon: string;
  color: string;
  description: string;
  missionCount: number;
}

export type MissionDifficulty = 'Novice' | 'Intermediate' | 'Advanced' | 'Master';
export type MissionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'puzzle' | 'comprehension' | 'daily_challenge';

export interface Question {
  id: string;
  missionId: string;
  prompt: string;
  contextText?: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correctAnswer: string;
  explanation: string;
  orderNum: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  narrativeIntro: string;
  subjectId: string;
  subjectName?: string;
  subjectColor?: string;
  difficulty: MissionDifficulty;
  xpReward: number;
  pointReward: number;
  estimatedMinutes: number;
  requiredLevel: number;
  type: MissionType;
  questions?: Question[];
  isDailyChallenge?: boolean;
  completed?: boolean;
}

export interface MissionAttempt {
  id: string;
  studentId: string;
  missionId: string;
  score: number;
  answers: Record<string, string>;
  xpEarned: number;
  pointsEarned: number;
  completedAt: string;
}

export type BadgeRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  requirementType: 'first_day' | 'streak' | 'subject_master' | 'missions_count' | 'mate_count' | 'top_rank' | 'opportunity_unlocked';
  requirementValue: number;
  rarity: BadgeRarity;
  unlockedAt?: string;
  isUnlocked?: boolean;
}

export type MateRequestStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export interface MateRequest {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  senderUsername: string;
  senderAvatar: string;
  senderSchool: string;
  senderLevel: number;
  status: MateRequestStatus;
  createdAt: string;
}

export interface Mate {
  id: string;
  studentId: string;
  displayName: string;
  username: string;
  avatar: string;
  schoolName: string;
  level: number;
  xp: number;
  isOnline: boolean;
  currentLocation?: string;
  establishedAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  room_id?: string;
  senderId: string;
  sender_id?: string;
  senderName: string;
  sender_name?: string;
  senderAvatar: string;
  sender_avatar?: string;
  senderRole?: Role;
  sender_level?: number;
  sender_school_code?: string;
  content: string;
  isModerated?: boolean;
  is_moderated?: number;
  createdAt: string;
  created_at?: string;
}

export interface ChatRoom {
  id: string;
  type: 'direct' | 'lounge' | 'school';
  name: string;
  description?: string;
  participantCount?: number;
  lastMessage?: ChatMessage;
}

export type OpportunityType = 'scholarship' | 'competition' | 'internship' | 'fellowship' | 'bootcamp' | 'school_prize' | 'certificate';

export interface Opportunity {
  id: string;
  title: string;
  provider: string;
  type: OpportunityType;
  description: string;
  requirementsSummary?: string;
  requirements_summary?: string;
  minLevel: number;
  min_level?: number;
  minPoints: number;
  min_points?: number;
  requiredSubject?: string;
  required_subject?: string;
  requiredMinScore?: number;
  required_min_score?: number;
  requiredBadgeCode?: string;
  required_badge_code?: string;
  externalUrl?: string;
  external_url?: string;
  deadline: string;
  reward: string;
  isUnlocked: boolean;
  unlockProgress: {
    levelMet: boolean;
    pointsMet: boolean;
    badgeMet: boolean;
    subjectScoreMet: boolean;
    percentage: number;
  };
}

export interface Competition {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'completed';
  school1Id: string;
  school1Name: string;
  school1Points: number;
  school2Id: string;
  school2Name: string;
  school2Points: number;
  winnerSchoolId?: string;
  totalParticipants: number;
}

export interface SocialPost {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  schoolName: string;
  type: 'level_up' | 'badge_unlocked' | 'mission_complete' | 'streak_milestone' | 'school_rank_up';
  title: string;
  subtitle: string;
  likesCount: number;
  hasLiked?: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  studentId: string;
  title: string;
  message: string;
  type: 'mate_request' | 'mate_accepted' | 'message' | 'badge_unlocked' | 'level_up' | 'leaderboard' | 'opportunity';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface TeacherAssessment {
  id: string;
  teacherId: string;
  teacherName: string;
  title: string;
  schoolId: string;
  schoolName: string;
  subjectId: string;
  subjectName: string;
  targetGrade: string;
  questions: Array<{
    prompt: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>;
  totalSubmissions: number;
  averageScore: number;
  deadline: string;
  createdAt: string;
}

export interface AssessmentSubmission {
  id: string;
  assessmentId: string;
  studentId: string;
  studentName: string;
  score: number;
  feedback: string;
  submittedAt: string;
}

export interface NarrativeEvent {
  id: string;
  title: string;
  location: string;
  timeOfDay: string;
  weather: string;
  narrativeText: string;
  ambience: string;
  availableActions: Array<{
    label: string;
    actionType: 'navigate' | 'mission' | 'chat' | 'interact';
    target: string;
    description: string;
  }>;
}

export type BuildingCategory = 'classroom' | 'facility' | 'field' | 'admin' | 'gate' | 'lounge' | 'scholarship';

export interface CampusBuilding {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  category: BuildingCategory;
  subjectCode?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  entranceX: number;
  entranceY: number;
  description: string;
  narrativeIntro: string;
  doorLabel: string;
}

export interface CampusPlayer {
  studentId: string;
  displayName: string;
  username: string;
  avatar: string;
  avatarSpriteIndex: number;
  level: number;
  schoolId: string;
  schoolCode: string;
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  currentZone?: string;
  lastSeen?: number;
}

export interface CampusConfig {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  mapWidth: number;
  mapHeight: number;
  tileSize: number;
  spawnX: number;
  spawnY: number;
  buildings: CampusBuilding[];
}

export interface CampusMoveEvent {
  studentId: string;
  schoolId: string;
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  currentZone?: string;
  timestamp: number;
}


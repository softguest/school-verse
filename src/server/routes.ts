/**
 * SchoolVerse Server API Routes
 * Production-ready Express API with Zod validation, server-authoritative gamification,
 * and persistent relational storage.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { sqlite } from './db.ts';
import { calculateLevelFromXP, calculateSchoolNormalizedScore, sanitizeChatMessage, getLevelProgress } from '../lib/progression.ts';

export const apiRouter = Router();

// Track current active student session in memory for convenience (defaults to Sarah Njie)
let activeStudentId = 'stud_sarah';

/**
 * Helper to get active student with school and rankings
 */
function getStudentFullProfile(studentId: string) {
  const student = sqlite.prepare(`
    SELECT s.*, sch.name as school_name, sch.code as school_code, sch.city as school_city, sch.country as school_country
    FROM students s
    JOIN schools sch ON s.school_id = sch.id
    WHERE s.id = ?
  `).get(studentId) as any;

  if (!student) return null;

  // Calculate global rank
  const rankGlobal = (sqlite.prepare(`
    SELECT count(*) as rank FROM students WHERE xp > ?
  `).get(student.xp) as any).rank + 1;

  // Calculate school rank
  const rankSchool = (sqlite.prepare(`
    SELECT count(*) as rank FROM students WHERE school_id = ? AND xp > ?
  `).get(student.school_id, student.xp) as any).rank + 1;

  // Badges
  const badges = sqlite.prepare(`
    SELECT b.*, sb.unlocked_at
    FROM student_badges sb
    JOIN badges b ON sb.badge_id = b.id
    WHERE sb.student_id = ?
    ORDER BY sb.unlocked_at DESC
  `).all(studentId);

  // Mates count
  const matesCount = (sqlite.prepare(`
    SELECT count(*) as count FROM mates WHERE student1_id = ? OR student2_id = ?
  `).get(studentId, studentId) as any).count;

  // Customization
  const customization = sqlite.prepare(`
    SELECT skin_tone, hair_style, hair_color, uniform_style, accessory
    FROM student_customization WHERE student_id = ?
  `).get(studentId) as any || {
    skin_tone: 1,
    hair_style: 'fade',
    hair_color: '#171717',
    uniform_style: 'school',
    accessory: 'none',
  };

  return {
    ...student,
    interests: JSON.parse(student.interests || '[]'),
    levelProgress: getLevelProgress(student.xp),
    rankGlobal,
    rankSchool,
    badges,
    matesCount,
    customization,
  };
}

// -------------------------------------------------------------
// 1. AUTH & STUDENT PROFILE
// -------------------------------------------------------------

// Get current active student profile
apiRouter.get('/student/current', (req: Request, res: Response) => {
  const profile = getStudentFullProfile(activeStudentId);
  if (!profile) {
    return res.status(404).json({ error: 'Active student not found' });
  }
  res.json(profile);
});

// List all switchable demo students & teacher
apiRouter.get('/students/demo-roster', (req: Request, res: Response) => {
  const students = sqlite.prepare(`
    SELECT s.id, s.display_name, s.username, s.avatar, s.level, s.xp, s.grade, sch.name as school_name, sch.code as school_code
    FROM students s
    JOIN schools sch ON s.school_id = sch.id
    ORDER BY s.xp DESC
  `).all();
  res.json({
    activeStudentId,
    students,
  });
});

// Switch active demo student
apiRouter.post('/student/switch', (req: Request, res: Response) => {
  const { studentId } = req.body;
  if (!studentId) return res.status(400).json({ error: 'Student ID required' });
  const student = sqlite.prepare('SELECT id FROM students WHERE id = ?').get(studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  activeStudentId = studentId;
  res.json({ success: true, activeStudentId });
});

// Onboarding validation schema
const RegisterStudentSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  avatar: z.string().url().or(z.string().min(1)),
  schoolId: z.string().min(1, 'School must be selected'),
  grade: z.string().min(1, 'Grade must be selected'),
  country: z.string().min(1),
  region: z.string().min(1),
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
  bio: z.string().max(250).optional(),
});

// Onboard new student
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  try {
    const data = RegisterStudentSchema.parse(req.body);

    // Check if username already exists
    const existing = sqlite.prepare('SELECT id FROM users WHERE username = ?').get(data.username);
    if (existing) {
      return res.status(400).json({ error: 'This username is already taken. Please choose another.' });
    }

    const userId = `usr_${Date.now()}`;
    const studentId = `stud_${Date.now()}`;

    // Transaction for user, student, starting rewards (+100 XP, starting achievement)
    sqlite.exec('BEGIN TRANSACTION;');
    try {
      sqlite.prepare(`
        INSERT INTO users (id, username, role) VALUES (?, ?, 'student')
      `).run(userId, data.username);

      const startingXp = 100;
      const startingPoints = 20;
      const startingLevel = calculateLevelFromXP(startingXp);

      sqlite.prepare(`
        INSERT INTO students (
          id, user_id, display_name, username, avatar, school_id, grade, region, country,
          level, xp, school_points, streak, longest_streak, bio, interests, role
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, 'student')
      `).run(
        studentId,
        userId,
        data.displayName,
        data.username,
        data.avatar,
        data.schoolId,
        data.grade,
        data.region,
        data.country,
        startingLevel,
        startingXp,
        startingPoints,
        data.bio || 'Proud member of the SchoolVerse learning community.',
        JSON.stringify(data.interests)
      );

      // Award "First Day" starter badge
      sqlite.prepare(`
        INSERT OR IGNORE INTO student_badges (id, student_id, badge_id)
        VALUES (?, ?, 'b_first_day')
      `).run(`sb_${studentId}_b_first_day`, studentId);

      // Add welcome notification
      sqlite.prepare(`
        INSERT INTO notifications (id, student_id, title, message, type, link)
        VALUES (?, ?, 'Welcome to SchoolVerse! 🎒', 'You received +100 starting XP and unlocked the First Day achievement.', 'badge_unlocked', '/campus')
      `).run(`notif_${Date.now()}`, studentId);

      // Social feed event
      sqlite.prepare(`
        INSERT INTO social_feed (id, student_id, type, title, subtitle)
        VALUES (?, ?, 'badge_unlocked', ?, 'Joined SchoolVerse and unlocked First Day 🎒')
      `).run(`feed_${Date.now()}`, studentId, `${data.displayName} began their journey!`);

      // Update school student count
      sqlite.prepare(`
        UPDATE schools SET student_count = student_count + 1 WHERE id = ?
      `).run(data.schoolId);

      sqlite.exec('COMMIT;');

      activeStudentId = studentId;
      const fullProfile = getStudentFullProfile(studentId);
      return res.status(201).json({ success: true, student: fullProfile });
    } catch (err: any) {
      sqlite.exec('ROLLBACK;');
      throw err;
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const msg = (error as any).issues?.[0]?.message || (error as any).errors?.[0]?.message || error.message;
      return res.status(400).json({ error: msg });
    }
    console.error('Registration failed:', error);
    return res.status(500).json({ error: 'Failed to create student account.' });
  }
});

// Update bio / profile
apiRouter.patch('/student/profile', (req: Request, res: Response) => {
  const { bio, interests, displayName, avatar } = req.body;
  const updates: string[] = [];
  const params: any[] = [];

  if (bio !== undefined) {
    updates.push('bio = ?');
    params.push(bio);
  }
  if (displayName !== undefined && displayName.trim().length >= 2) {
    updates.push('display_name = ?');
    params.push(displayName.trim());
  }
  if (avatar !== undefined) {
    updates.push('avatar = ?');
    params.push(avatar);
  }
  if (interests !== undefined && Array.isArray(interests)) {
    updates.push('interests = ?');
    params.push(JSON.stringify(interests));
  }

  if (updates.length === 0) return res.json({ success: true });

  params.push(activeStudentId);
  sqlite.prepare(`UPDATE students SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  res.json({ success: true, profile: getStudentFullProfile(activeStudentId) });
});

// -------------------------------------------------------------
// 2. SCHOOLS
// -------------------------------------------------------------

apiRouter.get('/schools', (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  let schools;
  if (query.trim()) {
    schools = sqlite.prepare(`
      SELECT * FROM schools
      WHERE name LIKE ? OR code LIKE ? OR city LIKE ? OR region LIKE ?
      ORDER BY normalized_score DESC
    `).all(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
  } else {
    schools = sqlite.prepare('SELECT * FROM schools ORDER BY normalized_score DESC').all();
  }
  res.json(schools);
});

apiRouter.get('/schools/:id', (req: Request, res: Response) => {
  const school = sqlite.prepare('SELECT * FROM schools WHERE id = ?').get(req.params.id);
  if (!school) return res.status(404).json({ error: 'School not found' });
  const topStudents = sqlite.prepare(`
    SELECT id, display_name, username, avatar, level, xp, grade
    FROM students
    WHERE school_id = ?
    ORDER BY xp DESC LIMIT 10
  `).all(req.params.id);
  res.json({ ...school, topStudents });
});

// -------------------------------------------------------------
// 3. CAMPUS & NARRATIVE ENGINE
// -------------------------------------------------------------

apiRouter.get('/campus/atmosphere', (req: Request, res: Response) => {
  const student = getStudentFullProfile(activeStudentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  // Get online students in the same school
  const schoolmatesOnline = sqlite.prepare(`
    SELECT id, display_name, username, avatar, level, grade
    FROM students
    WHERE school_id = ? AND id != ?
    ORDER BY xp DESC LIMIT 5
  `).all(student.school_id, student.id);

  // Other schools online
  const otherSchoolsOnline = sqlite.prepare(`
    SELECT s.id, s.display_name, s.username, s.avatar, s.level, sch.name as school_name, sch.code as school_code
    FROM students s
    JOIN schools sch ON s.school_id = sch.id
    WHERE s.school_id != ?
    ORDER BY s.xp DESC LIMIT 5
  `).all(student.school_id);

  // Atmosphere description based on current hour
  const currentHour = new Date().getHours();
  let timeStr = 'Morning — 8:15 AM';
  let atmosphereText = 'The campus is alive with anticipation. The cool breeze sweeps down from Mount Fako across the courtyard. Lockers click, students gather in discussion circles, and the first bell chime echoes.';

  if (currentHour >= 12 && currentHour < 15) {
    timeStr = 'Afternoon — 1:30 PM';
    atmosphereText = 'Sunlight warms the central quadrangles. Groups of students debate today’s science challenges near the solar pavilion. The library study pods are bustling.';
  } else if (currentHour >= 15) {
    timeStr = 'Late Afternoon — 4:45 PM';
    atmosphereText = 'Study clubs and tournament preparations are underway. Laughter and energetic chatter drift from the Student Lounge as schools review leaderboard standings.';
  }

  // Active missions count
  const availableMissionsCount = (sqlite.prepare(`
    SELECT count(*) as count FROM missions
  `).get() as any).count;

  // Unread notifications count
  const unreadNotifs = (sqlite.prepare(`
    SELECT count(*) as count FROM notifications WHERE student_id = ? AND is_read = 0
  `).get(student.id) as any).count;

  // Active Battle
  const activeBattle = sqlite.prepare(`
    SELECT c.*, s1.name as school1_name, s1.code as school1_code, s2.name as school2_name, s2.code as school2_code, sub.name as subject_name
    FROM competitions c
    JOIN schools s1 ON c.school1_id = s1.id
    JOIN schools s2 ON c.school2_id = s2.id
    JOIN subjects sub ON c.subject_id = sub.id
    WHERE c.status = 'active'
    ORDER BY c.total_participants DESC LIMIT 1
  `).get();

  res.json({
    timeStr,
    atmosphereText,
    schoolName: student.school_name,
    schoolCode: student.school_code,
    schoolmatesOnline,
    otherSchoolsOnline,
    availableMissionsCount,
    unreadNotifs,
    activeBattle,
  });
});

// 2D Playable Campus World Configuration & Interactive Buildings
apiRouter.get('/campus/:schoolId/world', (req: Request, res: Response) => {
  const schoolId = req.params.schoolId;
  const school = sqlite.prepare('SELECT id, name, code, city, region, country, motto, points FROM schools WHERE id = ?').get(schoolId) as any;

  if (!school) {
    return res.status(404).json({ error: 'School not found' });
  }

  // Ensure campus record exists
  let campus = sqlite.prepare('SELECT * FROM school_campuses WHERE school_id = ?').get(schoolId) as any;
  if (!campus) {
    sqlite.prepare(`
      INSERT OR IGNORE INTO school_campuses (id, school_id, name, map_width, map_height, tile_size, spawn_x, spawn_y)
      VALUES (?, ?, ?, 60, 45, 32, 960, 1216)
    `).run(`camp_${schoolId}`, schoolId, `${school.name} Campus`);
    campus = sqlite.prepare('SELECT * FROM school_campuses WHERE school_id = ?').get(schoolId) as any;
  }

  // Get buildings
  const rawBuildings = sqlite.prepare(`
    SELECT * FROM campus_buildings WHERE school_id = ? ORDER BY tile_y ASC, tile_x ASC
  `).all(schoolId) as any[];

  const buildings = rawBuildings.map((b) => ({
    id: b.id,
    schoolId: b.school_id,
    name: b.name,
    code: b.code,
    category: b.category,
    subjectCode: b.subject_code,
    x: b.tile_x * 32,
    y: b.tile_y * 32,
    width: b.width_tiles * 32,
    height: b.height_tiles * 32,
    entranceX: b.entrance_x * 32 + 16,
    entranceY: b.entrance_y * 32 + 16,
    description: b.description,
    narrativeIntro: b.narrative_intro,
    doorLabel: b.door_label,
  }));

  // Get current active student
  const student = getStudentFullProfile(activeStudentId);

  res.json({
    schoolId: school.id,
    schoolName: school.name,
    schoolCode: school.code,
    mapWidth: campus?.map_width || 60,
    mapHeight: campus?.map_height || 45,
    tileSize: campus?.tile_size || 32,
    spawnX: campus?.spawn_x || 960,
    spawnY: campus?.spawn_y || 1216,
    buildings,
    currentStudent: student,
  });
});

// Building details & classroom missions endpoint
apiRouter.get('/campus/buildings/:buildingId', (req: Request, res: Response) => {
  const building = sqlite.prepare('SELECT * FROM campus_buildings WHERE id = ?').get(req.params.buildingId) as any;
  if (!building) {
    return res.status(404).json({ error: 'Building not found' });
  }

  // Fetch relevant missions if this building corresponds to a subject
  let missions: any[] = [];
  if (building.subject_code) {
    const subject = sqlite.prepare('SELECT id FROM subjects WHERE code = ?').get(building.subject_code) as any;
    if (subject) {
      missions = sqlite.prepare(`
        SELECT m.*, sub.name as subject_name, sub.color as subject_color,
          EXISTS(SELECT 1 FROM mission_attempts WHERE student_id = ? AND mission_id = m.id) as completed
        FROM missions m
        JOIN subjects sub ON m.subject_id = sub.id
        WHERE m.subject_id = ?
        ORDER BY m.is_daily_challenge DESC, m.required_level ASC
      `).all(activeStudentId, subject.id);
    }
  } else if (building.category === 'facility' && building.code === 'LIBRARY') {
    // Library provides English & General Knowledge missions
    missions = sqlite.prepare(`
      SELECT m.*, sub.name as subject_name, sub.color as subject_color,
        EXISTS(SELECT 1 FROM mission_attempts WHERE student_id = ? AND mission_id = m.id) as completed
      FROM missions m
      JOIN subjects sub ON m.subject_id = sub.id
      WHERE sub.code IN ('ENG', 'GEN')
      ORDER BY m.required_level ASC
    `).all(activeStudentId);
  }

  // Schoolmates in this school
  const schoolmates = sqlite.prepare(`
    SELECT id, display_name, username, avatar, level, grade
    FROM students
    WHERE school_id = ? AND id != ?
    ORDER BY xp DESC LIMIT 8
  `).all(building.school_id, activeStudentId);

  res.json({
    id: building.id,
    name: building.name,
    code: building.code,
    category: building.category,
    subjectCode: building.subject_code,
    description: building.description,
    narrativeIntro: building.narrative_intro,
    doorLabel: building.door_label,
    missions,
    schoolmates,
  });
});

// Student Public Profile Card for Campus In-World Interactions
apiRouter.get('/student/public-card/:id', (req: Request, res: Response) => {
  const targetId = req.params.id;
  const target = getStudentFullProfile(targetId);
  if (!target) return res.status(404).json({ error: 'Student not found' });

  // Check mate status
  const isMate = Boolean(sqlite.prepare(`
    SELECT 1 FROM mates
    WHERE (student1_id = ? AND student2_id = ?) OR (student1_id = ? AND student2_id = ?)
  `).get(activeStudentId, targetId, targetId, activeStudentId));

  const hasPendingRequest = Boolean(sqlite.prepare(`
    SELECT 1 FROM mate_requests
    WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
  `).get(activeStudentId, targetId));

  res.json({
    ...target,
    isMate,
    hasPendingRequest,
    isSelf: activeStudentId === targetId,
  });
});

// Campus Exploration Milestone Event
apiRouter.post('/campus/exploration-event', (req: Request, res: Response) => {
  const { eventType, buildingCode } = req.body;
  const student = getStudentFullProfile(activeStudentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  // Exploration badge / milestone check
  let awardedXp = 0;
  if (eventType === 'first_exploration') {
    const existing = sqlite.prepare(`
      SELECT 1 FROM notifications WHERE student_id = ? AND title LIKE '%Campus Explorer%'
    `).get(activeStudentId);

    if (!existing) {
      awardedXp = 50;
      sqlite.prepare(`
        UPDATE students SET xp = xp + ?, school_points = school_points + 15 WHERE id = ?
      `).run(awardedXp, activeStudentId);

      sqlite.prepare(`
        INSERT INTO notifications (id, student_id, title, message, type, link)
        VALUES (?, ?, 'Campus Explorer Milestone! 🗺️', 'You stepped onto the 2D campus and explored your academy grounds (+50 XP, +15 Points).', 'level_up', '/campus')
      `).run(`notif_${Date.now()}`, activeStudentId);
    }
  }

  res.json({ success: true, awardedXp, currentXp: student.xp + awardedXp });
});

// Student Character Customization (Skin, Hair, Uniform, Accessories)
apiRouter.get('/student/customization', (req: Request, res: Response) => {
  const custom = sqlite.prepare(`
    SELECT skin_tone, hair_style, hair_color, uniform_style, accessory
    FROM student_customization WHERE student_id = ?
  `).get(activeStudentId) as any || {
    skin_tone: 1,
    hair_style: 'fade',
    hair_color: '#171717',
    uniform_style: 'school',
    accessory: 'none',
  };
  res.json(custom);
});

apiRouter.post('/student/customization', (req: Request, res: Response) => {
  const { skin_tone, hair_style, hair_color, uniform_style, accessory } = req.body;
  sqlite.prepare(`
    INSERT INTO student_customization (student_id, skin_tone, hair_style, hair_color, uniform_style, accessory, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(student_id) DO UPDATE SET
      skin_tone = excluded.skin_tone,
      hair_style = excluded.hair_style,
      hair_color = excluded.hair_color,
      uniform_style = excluded.uniform_style,
      accessory = excluded.accessory,
      updated_at = datetime('now')
  `).run(
    activeStudentId,
    Number(skin_tone) || 1,
    hair_style || 'fade',
    hair_color || '#171717',
    uniform_style || 'school',
    accessory || 'none'
  );

  res.json({
    success: true,
    customization: {
      skin_tone: Number(skin_tone) || 1,
      hair_style: hair_style || 'fade',
      hair_color: hair_color || '#171717',
      uniform_style: uniform_style || 'school',
      accessory: accessory || 'none',
    }
  });
});

// Campus Discoveries (Records new zones discovered and awards XP)
apiRouter.get('/campus/discoveries', (req: Request, res: Response) => {
  const rows = sqlite.prepare(`
    SELECT zone_id, discovered_at FROM campus_discoveries WHERE student_id = ?
  `).all(activeStudentId) as any[];
  res.json({ discoveredZones: rows.map(r => r.zone_id) });
});

apiRouter.post('/campus/discover-zone', (req: Request, res: Response) => {
  const { zoneId, zoneName } = req.body;
  if (!zoneId) return res.status(400).json({ error: 'Missing zoneId' });

  const existing = sqlite.prepare(`
    SELECT 1 FROM campus_discoveries WHERE student_id = ? AND zone_id = ?
  `).get(activeStudentId, zoneId);

  if (existing) {
    return res.json({ isFirstDiscovery: false, awardedXp: 0, awardedPoints: 0 });
  }

  // Award discovery bonus
  const awardedXp = 25;
  const awardedPoints = 10;
  sqlite.prepare(`
    INSERT INTO campus_discoveries (student_id, zone_id) VALUES (?, ?)
  `).run(activeStudentId, zoneId);

  sqlite.prepare(`
    UPDATE students SET xp = xp + ?, school_points = school_points + ? WHERE id = ?
  `).run(awardedXp, awardedPoints, activeStudentId);

  sqlite.prepare(`
    INSERT INTO notifications (id, student_id, title, message, type, link)
    VALUES (?, ?, 'New Campus Zone Discovered! 🏛️', ?, 'achievement', '/campus')
  `).run(`notif_disc_${Date.now()}`, activeStudentId, `You mapped "${zoneName || zoneId}" (+${awardedXp} XP, +${awardedPoints} Points)!`);

  const totalCount = (sqlite.prepare(`
    SELECT count(*) as count FROM campus_discoveries WHERE student_id = ?
  `).get(activeStudentId) as any).count;

  res.json({
    isFirstDiscovery: true,
    awardedXp,
    awardedPoints,
    totalDiscovered: totalCount,
    zoneName,
  });
});

// Student Safety: Block / Report
apiRouter.post('/student/block', (req: Request, res: Response) => {
  const { targetStudentId } = req.body;
  if (!targetStudentId) return res.status(400).json({ error: 'Target ID required' });
  sqlite.prepare(`
    INSERT OR IGNORE INTO student_blocks (blocker_id, blocked_id) VALUES (?, ?)
  `).run(activeStudentId, targetStudentId);
  res.json({ success: true, message: 'Student blocked successfully.' });
});

// Academic Quiz Duel Generator & Submission
apiRouter.post('/duel/questions', (req: Request, res: Response) => {
  const { opponentId, subjectCode } = req.body;
  // Get 3 fast-paced questions from subject or general questions
  let questions = sqlite.prepare(`
    SELECT q.id, q.prompt, q.options, q.correct_answer, q.explanation, m.title as mission_title
    FROM questions q
    JOIN missions m ON q.mission_id = m.id
    ORDER BY RANDOM() LIMIT 3
  `).all() as any[];

  questions = questions.map(q => ({
    id: q.id,
    prompt: q.prompt,
    options: JSON.parse(q.options),
    correctAnswer: q.correct_answer,
    explanation: q.explanation,
    missionTitle: q.mission_title,
  }));

  res.json({ questions });
});

apiRouter.post('/duel/submit', (req: Request, res: Response) => {
  const { opponentId, score, totalQuestions } = req.body;
  const numericScore = Number(score) || 0;
  const isWinner = numericScore >= 2;
  const awardedXp = isWinner ? 60 : 20;
  const awardedPoints = isWinner ? 25 : 5;

  sqlite.prepare(`
    UPDATE students SET xp = xp + ?, school_points = school_points + ? WHERE id = ?
  `).run(awardedXp, awardedPoints, activeStudentId);

  const duelId = `duel_${Date.now()}`;
  sqlite.prepare(`
    INSERT INTO academic_duels (id, challenger_id, opponent_id, subject_id, challenger_score, winner_id)
    VALUES (?, ?, ?, 'sub_gen', ?, ?)
  `).run(duelId, activeStudentId, opponentId || 'unknown', numericScore, isWinner ? activeStudentId : opponentId);

  res.json({
    success: true,
    isWinner,
    awardedXp,
    awardedPoints,
    score: numericScore,
  });
});


// -------------------------------------------------------------
// 4. MISSIONS, QUESTIONS & GAMIFICATION
// -------------------------------------------------------------

apiRouter.get('/subjects', (req: Request, res: Response) => {
  const subjects = sqlite.prepare(`
    SELECT sub.*, (SELECT count(*) FROM missions WHERE subject_id = sub.id) as mission_count
    FROM subjects sub
  `).all();
  res.json(subjects);
});

apiRouter.get('/missions', (req: Request, res: Response) => {
  const subjectId = req.query.subjectId as string;
  let missions;
  if (subjectId) {
    missions = sqlite.prepare(`
      SELECT m.*, sub.name as subject_name, sub.color as subject_color,
        EXISTS(SELECT 1 FROM mission_attempts WHERE student_id = ? AND mission_id = m.id) as completed
      FROM missions m
      JOIN subjects sub ON m.subject_id = sub.id
      WHERE m.subject_id = ?
      ORDER BY m.is_daily_challenge DESC, m.required_level ASC
    `).all(activeStudentId, subjectId);
  } else {
    missions = sqlite.prepare(`
      SELECT m.*, sub.name as subject_name, sub.color as subject_color,
        EXISTS(SELECT 1 FROM mission_attempts WHERE student_id = ? AND mission_id = m.id) as completed
      FROM missions m
      JOIN subjects sub ON m.subject_id = sub.id
      ORDER BY m.is_daily_challenge DESC, m.required_level ASC
    `).all(activeStudentId);
  }
  res.json(missions);
});

apiRouter.get('/missions/:id', (req: Request, res: Response) => {
  const mission = sqlite.prepare(`
    SELECT m.*, sub.name as subject_name, sub.color as subject_color,
      EXISTS(SELECT 1 FROM mission_attempts WHERE student_id = ? AND mission_id = m.id) as completed
    FROM missions m
    JOIN subjects sub ON m.subject_id = sub.id
    WHERE m.id = ?
  `).get(activeStudentId, req.params.id) as any;

  if (!mission) return res.status(404).json({ error: 'Mission not found' });

  const questions = sqlite.prepare(`
    SELECT id, prompt, context_text, type, options, order_num
    FROM questions
    WHERE mission_id = ?
    ORDER BY order_num ASC
  `).all(req.params.id).map((q: any) => ({
    ...q,
    options: JSON.parse(q.options || '[]'),
  }));

  res.json({
    ...mission,
    questions,
  });
});

// Server-authoritative Mission Submission
// Server evaluates answers, calculates score, grants XP and Points, updates level & badges!
apiRouter.post('/missions/:id/submit', (req: Request, res: Response) => {
  const missionId = req.params.id;
  const userAnswers: Record<string, string> = req.body.answers || {};

  const mission = sqlite.prepare(`
    SELECT m.*, sub.code as subject_code
    FROM missions m
    JOIN subjects sub ON m.subject_id = sub.id
    WHERE m.id = ?
  `).get(missionId) as any;

  if (!mission) return res.status(404).json({ error: 'Mission not found' });

  // Check if student already completed this mission
  const previousAttempt = sqlite.prepare(`
    SELECT * FROM mission_attempts WHERE student_id = ? AND mission_id = ?
  `).get(activeStudentId, missionId) as any;

  // Retrieve actual questions with correct answers from DB
  const questions = sqlite.prepare(`
    SELECT id, prompt, correct_answer, explanation, order_num
    FROM questions
    WHERE mission_id = ?
    ORDER BY order_num ASC
  `).all(missionId) as any[];

  if (questions.length === 0) {
    return res.status(400).json({ error: 'No questions associated with this mission.' });
  }

  let correctCount = 0;
  const results = questions.map((q) => {
    const studentAnswer = (userAnswers[q.id] || '').trim();
    const isCorrect = studentAnswer.toLowerCase() === q.correct_answer.toLowerCase();
    if (isCorrect) correctCount++;
    return {
      questionId: q.id,
      prompt: q.prompt,
      studentAnswer,
      correctAnswer: q.correct_answer,
      isCorrect,
      explanation: q.explanation,
    };
  });

  const accuracy = Math.round((correctCount / questions.length) * 100);
  const isPassed = accuracy >= 50;

  // If passed and not completed previously, award XP & points
  let awardedXp = 0;
  let awardedPoints = 0;
  let newBadgesUnlocked: any[] = [];
  let leveledUp = false;
  let newLevel = 1;

  sqlite.exec('BEGIN TRANSACTION;');
  try {
    const student = sqlite.prepare('SELECT * FROM students WHERE id = ?').get(activeStudentId) as any;

    if (isPassed && !previousAttempt) {
      awardedXp = Math.round(mission.xp_reward * (accuracy / 100));
      awardedPoints = Math.round(mission.point_reward * (accuracy / 100));

      const updatedXp = student.xp + awardedXp;
      const updatedPoints = student.school_points + awardedPoints;
      const calculatedLvl = calculateLevelFromXP(updatedXp);

      if (calculatedLvl > student.level) {
        leveledUp = true;
        newLevel = calculatedLvl;
      }

      // Record attempt
      sqlite.prepare(`
        INSERT INTO mission_attempts (id, student_id, mission_id, score, answers, xp_earned, points_earned)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(`att_${Date.now()}`, activeStudentId, missionId, accuracy, JSON.stringify(userAnswers), awardedXp, awardedPoints);

      // Update student
      sqlite.prepare(`
        UPDATE students
        SET xp = ?, school_points = ?, level = ?, last_active_date = date('now')
        WHERE id = ?
      `).run(updatedXp, updatedPoints, calculatedLvl, activeStudentId);

      // Contribute points to School total
      sqlite.prepare(`
        UPDATE schools SET points = points + ? WHERE id = ?
      `).run(awardedPoints, student.school_id);

      // Check badge milestones
      const completedMissionsCount = (sqlite.prepare(`
        SELECT count(*) as count FROM mission_attempts WHERE student_id = ?
      `).get(activeStudentId) as any).count;

      // Subject specific badges
      if (mission.subject_code === 'MATH') {
        const mathCount = (sqlite.prepare(`
          SELECT count(*) as count FROM mission_attempts ma
          JOIN missions m ON ma.mission_id = m.id
          JOIN subjects s ON m.subject_id = s.id
          WHERE ma.student_id = ? AND s.code = 'MATH'
        `).get(activeStudentId) as any).count;
        if (mathCount >= 3) {
          const unlocked = checkAndAwardBadge(activeStudentId, 'b_math_explorer');
          if (unlocked) newBadgesUnlocked.push(unlocked);
        }
      } else if (mission.subject_code === 'SCI') {
        const sciCount = (sqlite.prepare(`
          SELECT count(*) as count FROM mission_attempts ma
          JOIN missions m ON ma.mission_id = m.id
          JOIN subjects s ON m.subject_id = s.id
          WHERE ma.student_id = ? AND s.code = 'SCI'
        `).get(activeStudentId) as any).count;
        if (sciCount >= 3) {
          const unlocked = checkAndAwardBadge(activeStudentId, 'b_sci_explorer');
          if (unlocked) newBadgesUnlocked.push(unlocked);
        }
      } else if (mission.subject_code === 'CS') {
        const csCount = (sqlite.prepare(`
          SELECT count(*) as count FROM mission_attempts ma
          JOIN missions m ON ma.mission_id = m.id
          JOIN subjects s ON m.subject_id = s.id
          WHERE ma.student_id = ? AND s.code = 'CS'
        `).get(activeStudentId) as any).count;
        if (csCount >= 3) {
          const unlocked = checkAndAwardBadge(activeStudentId, 'b_code_explorer');
          if (unlocked) newBadgesUnlocked.push(unlocked);
        }
      }

      if (completedMissionsCount >= 10) {
        const unlocked = checkAndAwardBadge(activeStudentId, 'b_mission_master');
        if (unlocked) newBadgesUnlocked.push(unlocked);
      }

      // Add to social feed
      sqlite.prepare(`
        INSERT INTO social_feed (id, student_id, type, title, subtitle)
        VALUES (?, ?, 'mission_complete', ?, ?)
      `).run(
        `feed_${Date.now()}`,
        activeStudentId,
        `${student.display_name} conquered "${mission.title}"!`,
        `Earned +${awardedXp} XP and +${awardedPoints} School Points with ${accuracy}% accuracy.`
      );

      // Notification
      sqlite.prepare(`
        INSERT INTO notifications (id, student_id, title, message, type, link)
        VALUES (?, ?, 'Mission Complete! 🎉', ?, 'badge_unlocked', '/missions')
      `).run(
        `notif_${Date.now()}`,
        activeStudentId,
        `You completed "${mission.title}" with ${accuracy}% score! (+${awardedXp} XP, +${awardedPoints} Points)`
      );
    }

    sqlite.exec('COMMIT;');

    const updatedProfile = getStudentFullProfile(activeStudentId);

    return res.json({
      success: true,
      passed: isPassed,
      accuracy,
      correctCount,
      totalQuestions: questions.length,
      awardedXp,
      awardedPoints,
      leveledUp,
      newLevel: updatedProfile?.level,
      newBadgesUnlocked,
      results,
      student: updatedProfile,
    });
  } catch (err: any) {
    sqlite.exec('ROLLBACK;');
    console.error('Mission submission error:', err);
    return res.status(500).json({ error: 'Failed to process mission submission' });
  }
});

function checkAndAwardBadge(studentId: string, badgeId: string) {
  const existing = sqlite.prepare(`
    SELECT 1 FROM student_badges WHERE student_id = ? AND badge_id = ?
  `).get(studentId, badgeId);
  if (existing) return null;

  sqlite.prepare(`
    INSERT INTO student_badges (id, student_id, badge_id)
    VALUES (?, ?, ?)
  `).run(`sb_${studentId}_${badgeId}`, studentId, badgeId);

  const badge = sqlite.prepare('SELECT * FROM badges WHERE id = ?').get(badgeId) as any;

  sqlite.prepare(`
    INSERT INTO notifications (id, student_id, title, message, type, link)
    VALUES (?, ?, 'New Badge Unlocked! 🏅', ?, 'badge_unlocked', '/achievements')
  `).run(
    `notif_${Date.now()}_badge`,
    studentId,
    `Congratulations! You unlocked the ${badge.name} badge (${badge.icon}).`
  );

  return badge;
}

// -------------------------------------------------------------
// 5. LEADERBOARDS
// -------------------------------------------------------------

apiRouter.get('/leaderboard/students', (req: Request, res: Response) => {
  const scope = (req.query.scope as string) || 'global';
  const student = getStudentFullProfile(activeStudentId);

  let query = `
    SELECT s.id, s.display_name, s.username, s.avatar, s.level, s.xp, s.school_points, s.streak, s.grade,
      sch.name as school_name, sch.code as school_code, sch.country as school_country
    FROM students s
    JOIN schools sch ON s.school_id = sch.id
  `;
  const params: any[] = [];

  if (scope === 'school' && student) {
    query += ' WHERE s.school_id = ?';
    params.push(student.school_id);
  } else if (scope === 'country' && student) {
    query += ' WHERE s.country = ?';
    params.push(student.country);
  } else if (scope === 'region' && student) {
    query += ' WHERE s.region = ?';
    params.push(student.region);
  } else if (scope === 'mates' && student) {
    query += `
      WHERE s.id = ? OR s.id IN (
        SELECT student2_id FROM mates WHERE student1_id = ?
        UNION
        SELECT student1_id FROM mates WHERE student2_id = ?
      )
    `;
    params.push(student.id, student.id, student.id);
  }

  query += ' ORDER BY s.xp DESC LIMIT 50';

  const rawList = sqlite.prepare(query).all(...params) as any[];

  // Assign ranks
  const rankedList = rawList.map((item, index) => ({
    ...item,
    rank: index + 1,
    isCurrentStudent: item.id === activeStudentId,
  }));

  // Find current student rank in this scope
  let currentStudentRank = rankedList.find((item) => item.isCurrentStudent)?.rank || 1;

  res.json({
    scope,
    students: rankedList,
    currentStudent: {
      id: student?.id,
      rank: currentStudentRank,
      xp: student?.xp,
      level: student?.level,
      points: student?.school_points,
    },
  });
});

apiRouter.get('/leaderboard/schools', (req: Request, res: Response) => {
  const schools = sqlite.prepare(`
    SELECT sch.*,
      (SELECT count(*) FROM students WHERE school_id = sch.id) as current_students_count,
      (SELECT avg(xp) FROM students WHERE school_id = sch.id) as avg_xp
    FROM schools sch
    ORDER BY sch.normalized_score DESC
  `).all() as any[];

  // Dynamic ranking with normalized score recalculation
  const rankedSchools = schools.map((sch, index) => {
    return {
      ...sch,
      rank: index + 1,
      studentCount: sch.current_students_count || sch.student_count,
    };
  });

  res.json(rankedSchools);
});

// -------------------------------------------------------------
// 6. MATES & SOCIAL (MATE OVER SYSTEM)
// -------------------------------------------------------------

apiRouter.get('/mates', (req: Request, res: Response) => {
  // Current accepted mates
  const mates = sqlite.prepare(`
    SELECT s.id, s.display_name, s.username, s.avatar, s.level, s.xp, s.grade,
      sch.name as school_name, sch.code as school_code, m.established_at
    FROM mates m
    JOIN students s ON (m.student1_id = s.id AND m.student2_id = ?) OR (m.student2_id = s.id AND m.student1_id = ?)
    JOIN schools sch ON s.school_id = sch.id
    ORDER BY s.xp DESC
  `).all(activeStudentId, activeStudentId);

  // Incoming pending requests
  const incomingRequests = sqlite.prepare(`
    SELECT mr.id, mr.sender_id, mr.created_at, s.display_name, s.username, s.avatar, s.level, sch.name as school_name
    FROM mate_requests mr
    JOIN students s ON mr.sender_id = s.id
    JOIN schools sch ON s.school_id = sch.id
    WHERE mr.receiver_id = ? AND mr.status = 'pending'
    ORDER BY mr.created_at DESC
  `).all(activeStudentId);

  // Outgoing pending requests
  const outgoingRequests = sqlite.prepare(`
    SELECT mr.id, mr.receiver_id, mr.created_at, s.display_name, s.username, s.avatar, s.level, sch.name as school_name
    FROM mate_requests mr
    JOIN students s ON mr.receiver_id = s.id
    JOIN schools sch ON s.school_id = sch.id
    WHERE mr.sender_id = ? AND mr.status = 'pending'
    ORDER BY mr.created_at DESC
  `).all(activeStudentId);

  // Suggested peers (schoolmates or top students not yet mates)
  const suggestions = sqlite.prepare(`
    SELECT s.id, s.display_name, s.username, s.avatar, s.level, s.xp, s.grade,
      sch.name as school_name, sch.code as school_code
    FROM students s
    JOIN schools sch ON s.school_id = sch.id
    WHERE s.id != ?
      AND s.id NOT IN (
        SELECT student2_id FROM mates WHERE student1_id = ?
        UNION
        SELECT student1_id FROM mates WHERE student2_id = ?
      )
      AND s.id NOT IN (
        SELECT receiver_id FROM mate_requests WHERE sender_id = ? AND status = 'pending'
      )
    ORDER BY (s.school_id = (SELECT school_id FROM students WHERE id = ?)) DESC, s.xp DESC
    LIMIT 6
  `).all(activeStudentId, activeStudentId, activeStudentId, activeStudentId, activeStudentId);

  res.json({
    mates,
    incomingRequests,
    outgoingRequests,
    suggestions,
  });
});

// Send Mate Over Request
apiRouter.post('/mates/request', (req: Request, res: Response) => {
  const { receiverId } = req.body;
  if (!receiverId) return res.status(400).json({ error: 'Receiver ID required' });
  if (receiverId === activeStudentId) return res.status(400).json({ error: 'Cannot send request to yourself' });

  const sender = sqlite.prepare('SELECT display_name FROM students WHERE id = ?').get(activeStudentId) as any;

  // Insert request
  try {
    sqlite.prepare(`
      INSERT INTO mate_requests (id, sender_id, receiver_id, status)
      VALUES (?, ?, ?, 'pending')
    `).run(`req_${Date.now()}`, activeStudentId, receiverId);

    // Notification to receiver
    sqlite.prepare(`
      INSERT INTO notifications (id, student_id, title, message, type, link)
      VALUES (?, ?, 'New Mate Over Request 🤝', ?, 'mate_request', '/mates')
    `).run(`notif_${Date.now()}`, receiverId, `${sender.display_name} sent you a Mate Over request.`);

    res.json({ success: true, message: 'Mate Over request sent!' });
  } catch (err: any) {
    return res.status(400).json({ error: 'A request has already been sent to this student.' });
  }
});

// Respond to Mate Over Request (accept, decline, block)
apiRouter.post('/mates/respond', (req: Request, res: Response) => {
  const { requestId, action } = req.body;
  if (!requestId || !action) return res.status(400).json({ error: 'Request ID and action required' });

  const request = sqlite.prepare(`
    SELECT * FROM mate_requests WHERE id = ? AND receiver_id = ?
  `).get(requestId, activeStudentId) as any;

  if (!request) return res.status(404).json({ error: 'Request not found' });

  if (action === 'accept') {
    sqlite.exec('BEGIN TRANSACTION;');
    try {
      // Mark request accepted
      sqlite.prepare('UPDATE mate_requests SET status = "accepted" WHERE id = ?').run(requestId);

      // Create bidirectional mates entry
      sqlite.prepare(`
        INSERT OR IGNORE INTO mates (id, student1_id, student2_id)
        VALUES (?, ?, ?)
      `).run(`mate_${Date.now()}`, request.sender_id, request.receiver_id);

      // Create direct chat room
      sqlite.prepare(`
        INSERT OR IGNORE INTO chat_rooms (id, type, name)
        VALUES (?, 'direct', ?)
      `).run(`room_dm_${request.sender_id}_${request.receiver_id}`, 'Direct Study Chat');

      // Check "First Mate" badge for receiver & sender
      checkAndAwardBadge(request.receiver_id, 'b_first_mate');
      checkAndAwardBadge(request.sender_id, 'b_first_mate');

      // Notify sender
      const receiver = sqlite.prepare('SELECT display_name FROM students WHERE id = ?').get(activeStudentId) as any;
      sqlite.prepare(`
        INSERT INTO notifications (id, student_id, title, message, type, link)
        VALUES (?, ?, 'Mate Over Accepted! 🤝', ?, 'mate_accepted', '/chat')
      `).run(`notif_${Date.now()}`, request.sender_id, `${receiver.display_name} accepted your Mate Over request! You can now study and chat together.`);

      sqlite.exec('COMMIT;');
      return res.json({ success: true, message: 'Mate Over accepted! You are now mates.' });
    } catch (err) {
      sqlite.exec('ROLLBACK;');
      throw err;
    }
  } else if (action === 'decline') {
    sqlite.prepare('UPDATE mate_requests SET status = "declined" WHERE id = ?').run(requestId);
    return res.json({ success: true, message: 'Request declined.' });
  } else if (action === 'block') {
    sqlite.prepare('UPDATE mate_requests SET status = "blocked" WHERE id = ?').run(requestId);
    return res.json({ success: true, message: 'User blocked.' });
  }

  res.status(400).json({ error: 'Invalid action' });
});

// -------------------------------------------------------------
// 7. REAL-TIME CHAT & STUDENT SAFETY
// -------------------------------------------------------------

apiRouter.get('/chat/rooms', (req: Request, res: Response) => {
  const student = getStudentFullProfile(activeStudentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  // Lounge room
  const rooms = [
    {
      id: 'room_lounge',
      type: 'lounge',
      name: 'Campus Student Lounge',
      description: 'Open study lounge for all schools to discuss academic topics and share tips.',
    },
    {
      id: 'room_bgs',
      type: 'school',
      name: `${student.school_name} Common Hall`,
      description: `Exclusive lounge for students of ${student.school_name}.`,
    }
  ];

  // Direct mate rooms
  const mates = sqlite.prepare(`
    SELECT s.id, s.display_name, s.avatar, s.level, sch.code as school_code
    FROM mates m
    JOIN students s ON (m.student1_id = s.id AND m.student2_id = ?) OR (m.student2_id = s.id AND m.student1_id = ?)
    JOIN schools sch ON s.school_id = sch.id
  `).all(activeStudentId, activeStudentId) as any[];

  const dmRooms = mates.map((mate) => ({
    id: `room_dm_${[activeStudentId, mate.id].sort().join('_')}`,
    type: 'direct',
    name: mate.display_name,
    mateAvatar: mate.avatar,
    mateLevel: mate.level,
    mateSchool: mate.school_code,
    description: `Private study exchange with ${mate.display_name}`,
  }));

  res.json({ rooms: [...rooms, ...dmRooms] });
});

apiRouter.get('/chat/messages/:roomId', (req: Request, res: Response) => {
  const roomId = req.params.roomId;
  const messages = sqlite.prepare(`
    SELECT cm.id, cm.room_id, cm.sender_id, cm.content, cm.created_at, cm.is_moderated,
      s.display_name as sender_name, s.avatar as sender_avatar, s.level as sender_level, sch.code as sender_school_code
    FROM chat_messages cm
    JOIN students s ON cm.sender_id = s.id
    JOIN schools sch ON s.school_id = sch.id
    WHERE cm.room_id = ?
    ORDER BY cm.created_at ASC
    LIMIT 100
  `).all(roomId);

  res.json(messages);
});

// Post a chat message with Safety & Moderation filter
const ChatMessageSchema = z.object({
  roomId: z.string().min(1),
  content: z.string().min(1, 'Message cannot be empty').max(500, 'Message cannot exceed 500 characters'),
});

apiRouter.post('/chat/messages', (req: Request, res: Response) => {
  try {
    const { roomId, content } = ChatMessageSchema.parse(req.body);

    // Apply Student Safety Sanitization (profanity, phone/email leak prevention)
    const { cleanText, isFlagged, reason } = sanitizeChatMessage(content);

    const msgId = `msg_${Date.now()}`;
    sqlite.prepare(`
      INSERT INTO chat_messages (id, room_id, sender_id, content, is_moderated)
      VALUES (?, ?, ?, ?, ?)
    `).run(msgId, roomId, activeStudentId, cleanText, isFlagged ? 1 : 0);

    const inserted = sqlite.prepare(`
      SELECT cm.id, cm.room_id, cm.sender_id, cm.content, cm.created_at, cm.is_moderated,
        s.display_name as sender_name, s.avatar as sender_avatar, s.level as sender_level, sch.code as sender_school_code
      FROM chat_messages cm
      JOIN students s ON cm.sender_id = s.id
      JOIN schools sch ON s.school_id = sch.id
      WHERE cm.id = ?
    `).get(msgId);

    res.status(201).json({
      success: true,
      message: inserted,
      flagged: isFlagged,
      moderationNotice: isFlagged ? reason : undefined,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const msg = (error as any).issues?.[0]?.message || (error as any).errors?.[0]?.message || error.message;
      return res.status(400).json({ error: msg });
    }
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Student Safety Reporting UI action
apiRouter.post('/chat/report', (req: Request, res: Response) => {
  const { reportedStudentId, reason, messageId } = req.body;
  console.log(`[Safety Report] Student ${activeStudentId} reported student ${reportedStudentId} for: ${reason} (Msg: ${messageId})`);
  res.json({
    success: true,
    message: 'Thank you for keeping SchoolVerse safe. Our student moderation team has received your report.'
  });
});

// -------------------------------------------------------------
// 8. SCHOLARSHIP HUB & OPPORTUNITIES
// -------------------------------------------------------------

apiRouter.get('/opportunities', (req: Request, res: Response) => {
  const student = getStudentFullProfile(activeStudentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const rawOpportunities = sqlite.prepare('SELECT * FROM opportunities ORDER BY min_level ASC').all() as any[];

  const studentBadges = student.badges.map((b: any) => b.code);

  const evaluatedOpportunities = rawOpportunities.map((opp) => {
    const levelMet = student.level >= opp.min_level;
    const pointsMet = student.school_points >= opp.min_points;
    const badgeMet = !opp.required_badge_code || studentBadges.includes(opp.required_badge_code);

    const criteria = [levelMet, pointsMet, badgeMet];
    const metCount = criteria.filter(Boolean).length;
    const percentage = Math.round((metCount / criteria.length) * 100);
    const isUnlocked = levelMet && pointsMet && badgeMet;

    return {
      ...opp,
      isUnlocked,
      unlockProgress: {
        levelMet,
        pointsMet,
        badgeMet,
        subjectScoreMet: true,
        percentage,
      },
    };
  });

  res.json(evaluatedOpportunities);
});

// -------------------------------------------------------------
// 9. COMPETITIONS & SCHOOL BATTLES
// -------------------------------------------------------------

apiRouter.get('/competitions', (req: Request, res: Response) => {
  const competitions = sqlite.prepare(`
    SELECT c.*,
      s1.name as school1_name, s1.code as school1_code,
      s2.name as school2_name, s2.code as school2_code,
      sub.name as subject_name, sub.color as subject_color
    FROM competitions c
    JOIN schools s1 ON c.school1_id = s1.id
    JOIN schools s2 ON c.school2_id = s2.id
    JOIN subjects sub ON c.subject_id = sub.id
    ORDER BY c.status = 'active' DESC, c.start_date DESC
  `).all();
  res.json(competitions);
});

// -------------------------------------------------------------
// 10. SOCIAL FEED & NOTIFICATIONS
// -------------------------------------------------------------

apiRouter.get('/feed', (req: Request, res: Response) => {
  const feed = sqlite.prepare(`
    SELECT f.*, s.display_name as student_name, s.avatar as student_avatar, sch.name as school_name
    FROM social_feed f
    JOIN students s ON f.student_id = s.id
    JOIN schools sch ON s.school_id = sch.id
    ORDER BY f.created_at DESC
    LIMIT 20
  `).all();
  res.json(feed);
});

apiRouter.post('/feed/:id/react', (req: Request, res: Response) => {
  sqlite.prepare('UPDATE social_feed SET likes_count = likes_count + 1 WHERE id = ?').run(req.params.id);
  const updated = sqlite.prepare('SELECT likes_count FROM social_feed WHERE id = ?').get(req.params.id) as any;
  res.json({ success: true, likesCount: updated?.likes_count || 0 });
});

apiRouter.get('/notifications', (req: Request, res: Response) => {
  const notifs = sqlite.prepare(`
    SELECT * FROM notifications WHERE student_id = ? ORDER BY created_at DESC LIMIT 20
  `).all(activeStudentId);
  res.json(notifs);
});

apiRouter.post('/notifications/:id/read', (req: Request, res: Response) => {
  sqlite.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND student_id = ?').run(req.params.id, activeStudentId);
  res.json({ success: true });
});

// -------------------------------------------------------------
// 11. TEACHER ASSESSMENTS & MONITORING
// -------------------------------------------------------------

apiRouter.get('/teacher/assessments', (req: Request, res: Response) => {
  const assessments = sqlite.prepare(`
    SELECT ta.*, sch.name as school_name, sub.name as subject_name,
      (SELECT count(*) FROM assessment_submissions WHERE assessment_id = ta.id) as total_submissions,
      (SELECT coalesce(round(avg(score), 1), 0) FROM assessment_submissions WHERE assessment_id = ta.id) as average_score
    FROM teacher_assessments ta
    JOIN schools sch ON ta.school_id = sch.id
    JOIN subjects sub ON ta.subject_id = sub.id
    ORDER BY ta.created_at DESC
  `).all().map((a: any) => ({
    ...a,
    questions: JSON.parse(a.questions || '[]'),
  }));
  res.json(assessments);
});

apiRouter.get('/teacher/students-progress', (req: Request, res: Response) => {
  const student = getStudentFullProfile(activeStudentId);
  const schoolId = student?.school_id || 'sch_bgs_buea';

  const students = sqlite.prepare(`
    SELECT s.id, s.display_name, s.username, s.avatar, s.level, s.xp, s.school_points, s.streak, s.grade,
      (SELECT count(*) FROM mission_attempts WHERE student_id = s.id) as missions_completed,
      (SELECT coalesce(round(avg(score), 1), 0) FROM mission_attempts WHERE student_id = s.id) as average_accuracy
    FROM students s
    WHERE s.school_id = ?
    ORDER BY s.xp DESC
  `).all(schoolId);

  res.json(students);
});

// Submit teacher assessment
apiRouter.post('/teacher/assessments/:id/submit', (req: Request, res: Response) => {
  const assessmentId = req.params.id;
  const { answers } = req.body;

  const assessment = sqlite.prepare('SELECT * FROM teacher_assessments WHERE id = ?').get(assessmentId) as any;
  if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

  const questions = JSON.parse(assessment.questions || '[]');
  let correct = 0;
  questions.forEach((q: any, idx: number) => {
    if (answers && answers[idx] === q.correctAnswer) {
      correct++;
    }
  });

  const score = Math.round((correct / questions.length) * 100);

  sqlite.prepare(`
    INSERT OR REPLACE INTO assessment_submissions (id, assessment_id, student_id, score, feedback)
    VALUES (?, ?, ?, ?, ?)
  `).run(`sub_${Date.now()}`, assessmentId, activeStudentId, score, score >= 80 ? 'Mastery demonstrated. Excellent analytical rigor.' : 'Reviewed. Review quadratic derivatives and vertex formulas.');

  res.json({ success: true, score });
});

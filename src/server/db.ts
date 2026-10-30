/**
 * SchoolVerse SQLite Relational Database Engine
 * Powered by Node.js 22 native DatabaseSync
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { calculateLevelFromXP, calculateSchoolNormalizedScore } from '../lib/progression.ts';

// Ensure data directory exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'schoolverse.db');
export const sqlite = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode for high performance
sqlite.exec('PRAGMA foreign_keys = ON;');

/**
 * Initialize Schema
 */
export function initSchema() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS schools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      country TEXT NOT NULL,
      region TEXT NOT NULL,
      city TEXT NOT NULL,
      logo TEXT,
      description TEXT NOT NULL,
      motto TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      student_count INTEGER NOT NULL DEFAULT 1,
      normalized_score REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'student',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      display_name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      avatar TEXT NOT NULL,
      school_id TEXT NOT NULL REFERENCES schools(id),
      grade TEXT NOT NULL,
      region TEXT NOT NULL,
      country TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      xp INTEGER NOT NULL DEFAULT 100,
      school_points INTEGER NOT NULL DEFAULT 20,
      streak INTEGER NOT NULL DEFAULT 1,
      longest_streak INTEGER NOT NULL DEFAULT 1,
      last_active_date TEXT NOT NULL DEFAULT (date('now')),
      bio TEXT DEFAULT '',
      interests TEXT DEFAULT '[]',
      role TEXT NOT NULL DEFAULT 'student',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      narrative_intro TEXT NOT NULL,
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      difficulty TEXT NOT NULL,
      xp_reward INTEGER NOT NULL,
      point_reward INTEGER NOT NULL,
      estimated_minutes INTEGER NOT NULL,
      required_level INTEGER NOT NULL DEFAULT 1,
      type TEXT NOT NULL DEFAULT 'multiple_choice',
      is_daily_challenge INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
      prompt TEXT NOT NULL,
      context_text TEXT,
      type TEXT NOT NULL DEFAULT 'multiple_choice',
      options TEXT NOT NULL, -- JSON array
      correct_answer TEXT NOT NULL,
      explanation TEXT NOT NULL,
      order_num INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS mission_attempts (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      answers TEXT NOT NULL, -- JSON object
      xp_earned INTEGER NOT NULL,
      points_earned INTEGER NOT NULL,
      completed_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(student_id, mission_id)
    );

    CREATE TABLE IF NOT EXISTS student_progress (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      progress_percentage INTEGER NOT NULL DEFAULT 0,
      missions_completed INTEGER NOT NULL DEFAULT 0,
      UNIQUE(student_id, subject_id)
    );

    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      requirement_type TEXT NOT NULL,
      requirement_value INTEGER NOT NULL DEFAULT 1,
      rarity TEXT NOT NULL DEFAULT 'Common'
    );

    CREATE TABLE IF NOT EXISTS student_badges (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
      unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(student_id, badge_id)
    );

    CREATE TABLE IF NOT EXISTS mate_requests (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      receiver_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(sender_id, receiver_id)
    );

    CREATE TABLE IF NOT EXISTS mates (
      id TEXT PRIMARY KEY,
      student1_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      student2_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      established_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(student1_id, student2_id)
    );

    CREATE TABLE IF NOT EXISTS chat_rooms (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'lounge', -- lounge, school, direct
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      is_moderated INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      provider TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      requirements_summary TEXT NOT NULL,
      min_level INTEGER NOT NULL DEFAULT 1,
      min_points INTEGER NOT NULL DEFAULT 0,
      required_subject TEXT,
      required_min_score INTEGER,
      required_badge_code TEXT,
      external_url TEXT,
      deadline TEXT NOT NULL,
      reward TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS competitions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      description TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      school1_id TEXT NOT NULL REFERENCES schools(id),
      school1_points INTEGER NOT NULL DEFAULT 0,
      school2_id TEXT NOT NULL REFERENCES schools(id),
      school2_points INTEGER NOT NULL DEFAULT 0,
      winner_school_id TEXT REFERENCES schools(id),
      total_participants INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS social_feed (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      likes_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      link TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS teacher_assessments (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL REFERENCES users(id),
      teacher_name TEXT NOT NULL,
      title TEXT NOT NULL,
      school_id TEXT NOT NULL REFERENCES schools(id),
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      target_grade TEXT NOT NULL,
      questions TEXT NOT NULL, -- JSON array
      deadline TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS assessment_submissions (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL REFERENCES teacher_assessments(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      feedback TEXT,
      submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(assessment_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS school_campuses (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      map_width INTEGER NOT NULL DEFAULT 60,
      map_height INTEGER NOT NULL DEFAULT 45,
      tile_size INTEGER NOT NULL DEFAULT 32,
      spawn_x INTEGER NOT NULL DEFAULT 960,
      spawn_y INTEGER NOT NULL DEFAULT 1216,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(school_id)
    );

    CREATE TABLE IF NOT EXISTS campus_buildings (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      category TEXT NOT NULL,
      subject_code TEXT,
      tile_x INTEGER NOT NULL,
      tile_y INTEGER NOT NULL,
      width_tiles INTEGER NOT NULL,
      height_tiles INTEGER NOT NULL,
      entrance_x INTEGER NOT NULL,
      entrance_y INTEGER NOT NULL,
      description TEXT NOT NULL,
      narrative_intro TEXT NOT NULL,
      door_label TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS campus_sessions (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      x REAL NOT NULL DEFAULT 960,
      y REAL NOT NULL DEFAULT 1216,
      direction TEXT NOT NULL DEFAULT 'down',
      current_zone TEXT DEFAULT 'courtyard',
      last_active TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(student_id)
    );

    CREATE TABLE IF NOT EXISTS student_customization (
      student_id TEXT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
      skin_tone INTEGER NOT NULL DEFAULT 1,
      hair_style TEXT NOT NULL DEFAULT 'fade',
      hair_color TEXT NOT NULL DEFAULT '#171717',
      uniform_style TEXT NOT NULL DEFAULT 'school',
      accessory TEXT NOT NULL DEFAULT 'none',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS campus_discoveries (
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      zone_id TEXT NOT NULL,
      discovered_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (student_id, zone_id)
    );

    CREATE TABLE IF NOT EXISTS student_blocks (
      blocker_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      blocked_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (blocker_id, blocked_id)
    );

    CREATE TABLE IF NOT EXISTS academic_duels (
      id TEXT PRIMARY KEY,
      challenger_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      opponent_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      status TEXT NOT NULL DEFAULT 'completed',
      challenger_score INTEGER NOT NULL DEFAULT 0,
      opponent_score INTEGER NOT NULL DEFAULT 0,
      winner_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_students_xp ON students(xp DESC);
    CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_campus_buildings_school ON campus_buildings(school_id);
    CREATE INDEX IF NOT EXISTS idx_campus_discoveries ON campus_discoveries(student_id);
  `);
}

/**
 * Seed Comprehensive Realistic Data
 */
export function seedData() {
  const schoolCount = sqlite.prepare('SELECT count(*) as count FROM schools').get() as { count: number };
  if (schoolCount.count > 0) return; // already seeded

  console.log('[SchoolVerse] Seeding realistic database...');

  // 1. Insert Schools
  const insertSchool = sqlite.prepare(`
    INSERT INTO schools (id, name, code, country, region, city, description, motto, points, student_count, normalized_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const schools = [
    {
      id: 'sch_bgs_buea',
      name: 'Bilingual Grammar School Molyko',
      code: 'BGS-BUEA',
      country: 'Cameroon',
      region: 'South West',
      city: 'Buea',
      description: 'A prestigious public bilingual high school nestled at the foot of Mount Fako, renowned for academic excellence in sciences and arts.',
      motto: 'Labor Vincit Omnia (Hard Work Conquers All)',
      points: 7420,
      student_count: 8,
      normalizedScore: 842.5
    },
    {
      id: 'sch_shc_bam',
      name: 'Sacred Heart College Mankon',
      code: 'SHC-BAM',
      country: 'Cameroon',
      region: 'North West',
      city: 'Bamenda',
      description: 'Historical college established in 1961, celebrated for discipline, national mathematics champions, and transformative leadership.',
      motto: 'Veritas Vos Liberabit (The Truth Shall Set You Free)',
      points: 6980,
      student_count: 6,
      normalizedScore: 835.0
    },
    {
      id: 'sch_lgl_yao',
      name: 'Lycée Général Leclerc',
      code: 'LGL-YAO',
      country: 'Cameroon',
      region: 'Centre',
      city: 'Yaoundé',
      description: 'Historic capital academy founded in 1952, producing premier national researchers, diplomats, and innovators.',
      motto: 'Virtus et Scientia (Virtue and Knowledge)',
      points: 6240,
      student_count: 5,
      normalizedScore: 818.0
    },
    {
      id: 'sch_ghs_lmb',
      name: 'Government High School Limbe',
      code: 'GHS-LMB',
      country: 'Cameroon',
      region: 'South West',
      city: 'Limbe',
      description: 'Premier coastal high school recognized for marine ecology research, mathematics club, and vibrant inter-school sports.',
      motto: 'Knowledge is Power',
      points: 5890,
      student_count: 4,
      normalizedScore: 792.0
    },
    {
      id: 'sch_ala_jhb',
      name: 'African Leadership Academy',
      code: 'ALA-JHB',
      country: 'South Africa',
      region: 'Gauteng',
      city: 'Johannesburg',
      description: 'Pan-African institution developing the next generation of ethical and entrepreneurial leaders across the continent.',
      motto: 'Shaping Africa’s Future',
      points: 8150,
      student_count: 6,
      normalizedScore: 864.0
    },
    {
      id: 'sch_ach_acc',
      name: 'Achimota School',
      code: 'ACH-ACC',
      country: 'Ghana',
      region: 'Greater Accra',
      city: 'Accra',
      description: 'Pioneering co-educational institution with a rich heritage in mathematics, pan-African humanities, and debate.',
      motto: 'Ut Omnes Unum Sint (That All May Be One)',
      points: 6120,
      student_count: 4,
      normalizedScore: 785.0
    }
  ];

  for (const s of schools) {
    insertSchool.run(s.id, s.name, s.code, s.country, s.region, s.city, s.description, s.motto, s.points, s.student_count, s.normalizedScore);
  }

  // 2. Insert Subjects
  const insertSubject = sqlite.prepare(`
    INSERT INTO subjects (id, name, code, icon, color, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const subjects = [
    {
      id: 'sub_math',
      name: 'Mathematics',
      code: 'MATH',
      icon: 'Binary',
      color: 'amber',
      description: 'Algebra, geometry, statistics, and mental calculus challenges.'
    },
    {
      id: 'sub_eng',
      name: 'English & Literature',
      code: 'ENG',
      icon: 'BookOpen',
      color: 'blue',
      description: 'Grammar mastery, African literature comprehension, and critical analysis.'
    },
    {
      id: 'sub_sci',
      name: 'Natural Sciences',
      code: 'SCI',
      icon: 'Atom',
      color: 'emerald',
      description: 'Cell biology, chemical reactions, environmental physics, and ecology.'
    },
    {
      id: 'sub_cs',
      name: 'Computer Science',
      code: 'CS',
      icon: 'Code2',
      color: 'purple',
      description: 'Algorithms, data structures, web architecture, and computational logic.'
    },
    {
      id: 'sub_gen',
      name: 'Pan-African & General Knowledge',
      code: 'GEN',
      icon: 'Globe2',
      color: 'rose',
      description: 'African history, geography, environmental sustainability, and innovation.'
    }
  ];

  for (const sub of subjects) {
    insertSubject.run(sub.id, sub.name, sub.code, sub.icon, sub.color, sub.description);
  }

  // 3. Insert Badges
  const insertBadge = sqlite.prepare(`
    INSERT INTO badges (id, code, name, description, icon, requirement_type, requirement_value, rarity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const badges = [
    { id: 'b_first_day', code: 'first_day', name: 'First Day', description: 'Began the SchoolVerse journey and joined your school.', icon: '🎒', requirement_type: 'first_day', requirement_value: 1, rarity: 'Common' },
    { id: 'b_math_explorer', code: 'math_explorer', name: 'Mathematics Explorer', description: 'Solved 3 or more advanced mathematics challenges.', icon: '🧮', requirement_type: 'subject_master', requirement_value: 3, rarity: 'Rare' },
    { id: 'b_sci_explorer', code: 'sci_explorer', name: 'Science Explorer', description: 'Investigated laboratory phenomena and natural sciences.', icon: '🔬', requirement_type: 'subject_master', requirement_value: 3, rarity: 'Rare' },
    { id: 'b_code_explorer', code: 'code_explorer', name: 'Coding Explorer', description: 'Debugged algorithms and cracked digital puzzles.', icon: '💻', requirement_type: 'subject_master', requirement_value: 3, rarity: 'Rare' },
    { id: 'b_bookworm', code: 'bookworm', name: 'Bookworm', description: 'Mastered literary comprehension in the library.', icon: '📚', requirement_type: 'missions_count', requirement_value: 5, rarity: 'Common' },
    { id: 'b_streak_7', code: 'streak_7', name: '7-Day Streak', description: 'Logged in and completed academic missions for 7 consecutive days.', icon: '🔥', requirement_type: 'streak', requirement_value: 7, rarity: 'Epic' },
    { id: 'b_first_mate', code: 'first_mate', name: 'First Mate', description: 'Formed your first study bond via the Mate Over system.', icon: '🤝', requirement_type: 'mate_count', requirement_value: 1, rarity: 'Common' },
    { id: 'b_top_100', code: 'top_100', name: 'Top 100 Champion', description: 'Reached the elite top 100 students nationwide.', icon: '🏆', requirement_type: 'top_rank', requirement_value: 100, rarity: 'Epic' },
    { id: 'b_inter_school', code: 'inter_school', name: 'Inter-School Explorer', description: 'Connected with peers from 3 different schools.', icon: '🌍', requirement_type: 'mate_count', requirement_value: 3, rarity: 'Rare' },
    { id: 'b_mission_master', code: 'mission_master', name: 'Mission Master', description: 'Successfully resolved 10 full academic missions.', icon: '🎯', requirement_type: 'missions_count', requirement_value: 10, rarity: 'Legendary' },
  ];

  for (const b of badges) {
    insertBadge.run(b.id, b.code, b.name, b.description, b.icon, b.requirement_type, b.requirement_value, b.rarity);
  }

  // 4. Insert Users and Students (25+ authentic student profiles)
  const insertUser = sqlite.prepare(`
    INSERT INTO users (id, username, email, role)
    VALUES (?, ?, ?, ?)
  `);

  const insertStudent = sqlite.prepare(`
    INSERT INTO students (id, user_id, display_name, username, avatar, school_id, grade, region, country, level, xp, school_points, streak, longest_streak, bio, interests, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertStudentBadge = sqlite.prepare(`
    INSERT OR IGNORE INTO student_badges (id, student_id, badge_id)
    VALUES (?, ?, ?)
  `);

  const studentsData = [
    // Primary Demo User: Sarah Njie
    {
      id: 'stud_sarah',
      userId: 'usr_sarah',
      displayName: 'Sarah Njie',
      username: 'sarah_n',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=sarah',
      schoolId: 'sch_bgs_buea',
      grade: 'Upper Sixth (Grade 12)',
      region: 'South West',
      country: 'Cameroon',
      xp: 8420,
      points: 620,
      streak: 12,
      longestStreak: 15,
      bio: 'Aspiring Biomedical Software Engineer. President of BGS Science Club.',
      interests: JSON.stringify(['Mathematics', 'Science', 'Coding', 'Leadership']),
      badges: ['b_first_day', 'b_math_explorer', 'b_sci_explorer', 'b_streak_7', 'b_first_mate', 'b_top_100']
    },
    // Emmanuel Fofana
    {
      id: 'stud_emmanuel',
      userId: 'usr_emmanuel',
      displayName: 'Emmanuel Fofana',
      username: 'efofana',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=emmanuel',
      schoolId: 'sch_shc_bam',
      grade: 'Upper Sixth (Grade 12)',
      region: 'North West',
      country: 'Cameroon',
      xp: 7150,
      points: 510,
      streak: 9,
      longestStreak: 11,
      bio: 'Math Olympiad medalist. Passionate about robotics and discrete mathematics.',
      interests: JSON.stringify(['Mathematics', 'Coding', 'Technology']),
      badges: ['b_first_day', 'b_math_explorer', 'b_code_explorer', 'b_streak_7', 'b_first_mate']
    },
    // Grace Biya
    {
      id: 'stud_grace',
      userId: 'usr_grace',
      displayName: 'Grace Biya',
      username: 'grace_b',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=grace',
      schoolId: 'sch_lgl_yao',
      grade: 'Lower Sixth (Grade 11)',
      region: 'Centre',
      country: 'Cameroon',
      xp: 6800,
      points: 490,
      streak: 14,
      longestStreak: 14,
      bio: 'Literature enthusiast and debates captain. Reading Chinua Achebe and Wole Soyinka.',
      interests: JSON.stringify(['Reading', 'Arts', 'Leadership', 'General Knowledge']),
      badges: ['b_first_day', 'b_bookworm', 'b_streak_7', 'b_inter_school', 'b_first_mate']
    },
    // Michael Kamga
    {
      id: 'stud_michael',
      userId: 'usr_michael',
      displayName: 'Michael Kamga',
      username: 'mkamga',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=michael',
      schoolId: 'sch_bgs_buea',
      grade: 'Form 5 (Grade 10)',
      region: 'South West',
      country: 'Cameroon',
      xp: 5900,
      points: 420,
      streak: 5,
      longestStreak: 8,
      bio: 'Junior coder building web apps with TypeScript and Python.',
      interests: JSON.stringify(['Coding', 'Mathematics', 'Sports']),
      badges: ['b_first_day', 'b_code_explorer', 'b_first_mate']
    },
    // Amina Bello
    {
      id: 'stud_amina',
      userId: 'usr_amina',
      displayName: 'Amina Bello',
      username: 'amina_b',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=amina',
      schoolId: 'sch_ala_jhb',
      grade: 'Year 2 (Grade 12)',
      region: 'Gauteng',
      country: 'South Africa',
      xp: 7950,
      points: 580,
      streak: 11,
      longestStreak: 18,
      bio: 'Renewable energy researcher. Winner of 2025 Young African Green Innovators.',
      interests: JSON.stringify(['Science', 'Agriculture', 'Leadership', 'Entrepreneurship']),
      badges: ['b_first_day', 'b_sci_explorer', 'b_top_100', 'b_streak_7']
    },
    // Kofi Mensah
    {
      id: 'stud_kofi',
      userId: 'usr_kofi',
      displayName: 'Kofi Mensah',
      username: 'kmensah',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=kofi',
      schoolId: 'sch_ach_acc',
      grade: 'SHS 3 (Grade 12)',
      region: 'Greater Accra',
      country: 'Ghana',
      xp: 5200,
      points: 380,
      streak: 6,
      longestStreak: 9,
      bio: 'Passionate about African political economy and algorithmic game theory.',
      interests: JSON.stringify(['General Knowledge', 'Mathematics', 'Leadership']),
      badges: ['b_first_day', 'b_first_mate', 'b_bookworm']
    },
    // Chidi Okonkwo
    {
      id: 'stud_chidi',
      userId: 'usr_chidi',
      displayName: 'Chidi Okonkwo',
      username: 'chidi_o',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=chidi',
      schoolId: 'sch_bgs_buea',
      grade: 'Upper Sixth (Grade 12)',
      region: 'South West',
      country: 'Cameroon',
      xp: 4600,
      points: 340,
      streak: 8,
      longestStreak: 8,
      bio: 'Chemistry and physics buff. Always ready for school laboratory battles.',
      interests: JSON.stringify(['Science', 'Mathematics']),
      badges: ['b_first_day', 'b_sci_explorer', 'b_first_mate']
    },
    // Beatrice Eko
    {
      id: 'stud_beatrice',
      userId: 'usr_beatrice',
      displayName: 'Beatrice Eko',
      username: 'beatrice_e',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=beatrice',
      schoolId: 'sch_ghs_lmb',
      grade: 'Form 5 (Grade 10)',
      region: 'South West',
      country: 'Cameroon',
      xp: 4200,
      points: 310,
      streak: 4,
      longestStreak: 7,
      bio: 'Marine enthusiast and English literature lover.',
      interests: JSON.stringify(['Reading', 'Science', 'Arts']),
      badges: ['b_first_day', 'b_bookworm']
    },
    // Tariq Ndive
    {
      id: 'stud_tariq',
      userId: 'usr_tariq',
      displayName: 'Tariq Ndive',
      username: 'tariq_n',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=tariq',
      schoolId: 'sch_bgs_buea',
      grade: 'Lower Sixth (Grade 11)',
      region: 'South West',
      country: 'Cameroon',
      xp: 3800,
      points: 290,
      streak: 7,
      longestStreak: 10,
      bio: 'Basketball point guard and competitive math solver.',
      interests: JSON.stringify(['Sports', 'Mathematics']),
      badges: ['b_first_day', 'b_first_mate']
    },
    // Diane Manga
    {
      id: 'stud_diane',
      userId: 'usr_diane',
      displayName: 'Diane Manga',
      username: 'diane_m',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=diane',
      schoolId: 'sch_shc_bam',
      grade: 'Upper Sixth (Grade 12)',
      region: 'North West',
      country: 'Cameroon',
      xp: 3500,
      points: 260,
      streak: 3,
      longestStreak: 6,
      bio: 'History & diplomacy explorer.',
      interests: JSON.stringify(['Leadership', 'Reading']),
      badges: ['b_first_day']
    },
    // Junior Tambe
    {
      id: 'stud_junior',
      userId: 'usr_junior',
      displayName: 'Junior Tambe',
      username: 'jtambe',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=junior',
      schoolId: 'sch_ghs_lmb',
      grade: 'Form 4 (Grade 9)',
      region: 'South West',
      country: 'Cameroon',
      xp: 2900,
      points: 220,
      streak: 4,
      longestStreak: 5,
      bio: 'Learning scratch and python.',
      interests: JSON.stringify(['Coding', 'Technology']),
      badges: ['b_first_day', 'b_code_explorer']
    },
    // Zainab Njoya
    {
      id: 'stud_zainab',
      userId: 'usr_zainab',
      displayName: 'Zainab Njoya',
      username: 'z_njoya',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=zainab',
      schoolId: 'sch_lgl_yao',
      grade: 'Seconde (Grade 10)',
      region: 'Centre',
      country: 'Cameroon',
      xp: 2600,
      points: 200,
      streak: 2,
      longestStreak: 4,
      bio: 'Exploring botanical taxonomy and cell biology.',
      interests: JSON.stringify(['Science', 'Agriculture']),
      badges: ['b_first_day']
    }
  ];

  for (const s of studentsData) {
    insertUser.run(s.userId, s.username, `${s.username}@schoolverse.demo`, 'student');
    const level = calculateLevelFromXP(s.xp);
    insertStudent.run(
      s.id,
      s.userId,
      s.displayName,
      s.username,
      s.avatar,
      s.schoolId,
      s.grade,
      s.region,
      s.country,
      level,
      s.xp,
      s.points,
      s.streak,
      s.longestStreak,
      s.bio,
      s.interests,
      'student'
    );

    // Give badges
    for (const bId of s.badges) {
      insertStudentBadge.run(`sb_${s.id}_${bId}`, s.id, bId);
    }
  }

  // Teacher Demo User
  insertUser.run('usr_teacher_fon', 'mr_fon', 'fon.math@bgs.edu.cm', 'teacher');

  // 5. Establish Mates & Mate Requests for Sarah
  const insertMate = sqlite.prepare(`
    INSERT INTO mates (id, student1_id, student2_id)
    VALUES (?, ?, ?)
  `);

  const insertMateRequest = sqlite.prepare(`
    INSERT INTO mate_requests (id, sender_id, receiver_id, status)
    VALUES (?, ?, ?, ?)
  `);

  // Sarah is mates with Emmanuel, Grace, and Michael
  insertMate.run('mate_1', 'stud_sarah', 'stud_emmanuel');
  insertMate.run('mate_2', 'stud_sarah', 'stud_grace');
  insertMate.run('mate_3', 'stud_sarah', 'stud_michael');

  // Pending incoming Mate Over requests for Sarah
  insertMateRequest.run('req_1', 'stud_amina', 'stud_sarah', 'pending');
  insertMateRequest.run('req_2', 'stud_kofi', 'stud_sarah', 'pending');

  // 6. Chat Rooms & Messages
  const insertRoom = sqlite.prepare(`
    INSERT INTO chat_rooms (id, type, name)
    VALUES (?, ?, ?)
  `);

  const insertMessage = sqlite.prepare(`
    INSERT INTO chat_messages (id, room_id, sender_id, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertRoom.run('room_lounge', 'lounge', 'Campus Student Lounge');
  insertRoom.run('room_bgs', 'school', 'BGS Molyko Common Hall');
  insertRoom.run('room_sarah_emmanuel', 'direct', 'Sarah & Emmanuel');
  insertRoom.run('room_sarah_grace', 'direct', 'Sarah & Grace');

  // Seed messages in lounge
  const now = new Date();
  const formatTime = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60000).toISOString();

  insertMessage.run('msg_1', 'room_lounge', 'stud_emmanuel', 'Hey everyone! Did anyone tackle the Calculus Integral mission in the Lab yet?', formatTime(25));
  insertMessage.run('msg_2', 'room_lounge', 'stud_grace', 'Yes! The explanation for step 2 was super helpful. Remember to factor out the constant first!', formatTime(20));
  insertMessage.run('msg_3', 'room_lounge', 'stud_sarah', 'That was a solid mission! Helped me reach 8,400 XP. Getting ready for the Battle of Mount Fako math tournament 🚀', formatTime(15));
  insertMessage.run('msg_4', 'room_lounge', 'stud_amina', 'ALA is ready for the Inter-School challenge too! Best of luck to BGS Molyko!', formatTime(10));
  insertMessage.run('msg_5', 'room_lounge', 'stud_michael', 'Our school is currently #1 in the South West region! Keep completing daily challenges everyone!', formatTime(5));

  // Seed direct chat with Emmanuel
  insertMessage.run('msg_dm_1', 'room_sarah_emmanuel', 'stud_emmanuel', 'Hey Sarah! Did you submit today’s Environmental Science challenge?', formatTime(40));
  insertMessage.run('msg_dm_2', 'room_sarah_emmanuel', 'stud_sarah', 'Just did! Got 100% on the solar absorption question ☀️', formatTime(35));
  insertMessage.run('msg_dm_3', 'room_sarah_emmanuel', 'stud_emmanuel', 'Nice! We are neck and neck on the national leaderboard.', formatTime(30));

  // 7. Seed Academic Missions and Questions
  const insertMission = sqlite.prepare(`
    INSERT INTO missions (id, title, description, narrative_intro, subject_id, difficulty, xp_reward, point_reward, estimated_minutes, required_level, type, is_daily_challenge)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertQuestion = sqlite.prepare(`
    INSERT INTO questions (id, mission_id, prompt, context_text, type, options, correct_answer, explanation, order_num)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const missionsData = [
    // MATH 1: Daily Challenge
    {
      id: 'mis_math_daily',
      title: 'The Agricultural Profit Puzzle',
      description: 'Calculate real-world yield percentages and optimize crop revenue for a cooperative farm.',
      narrativeIntro: 'You step into the Mathematics lecture room. Mr. Fon stands at the chalkboard drawing a diagram of cocoa harvests in the South West region. "Pay close attention," he says. "Applied mathematics feeds nations."',
      subjectId: 'sub_math',
      difficulty: 'Intermediate',
      xpReward: 150,
      pointReward: 60,
      estimatedMinutes: 5,
      requiredLevel: 1,
      type: 'daily_challenge',
      isDailyChallenge: 1,
      questions: [
        {
          id: 'q_m_1',
          prompt: 'A farmer in Buea harvests 50 bags of cocoa. 20% are sold at market price immediately, and 30% are stored for seed stock. How many bags remain for processing?',
          contextText: 'Total: 50 bags. 20% sold immediately. 30% stored.',
          type: 'multiple_choice',
          options: JSON.stringify(['10 bags', '20 bags', '25 bags', '35 bags']),
          correctAnswer: '25 bags',
          explanation: '20% of 50 = 10 bags sold. 30% of 50 = 15 bags stored. Remaining: 50 - (10 + 15) = 25 bags.',
          orderNum: 1
        },
        {
          id: 'q_m_2',
          prompt: 'If the selling price of 1 bag is 40,000 FCFA and inflation increases the next month by 15%, what will be the new price per bag?',
          contextText: 'Initial Price: 40,000 FCFA. Increase: 15%.',
          type: 'multiple_choice',
          options: JSON.stringify(['44,000 FCFA', '46,000 FCFA', '48,000 FCFA', '50,000 FCFA']),
          correctAnswer: '46,000 FCFA',
          explanation: '15% of 40,000 = 6,000 FCFA. 40,000 + 6,000 = 46,000 FCFA.',
          orderNum: 2
        }
      ]
    },
    // MATH 2: Quadratic Equations & Trajectory
    {
      id: 'mis_math_quad',
      title: 'Orbital Parabolas & Rockets',
      description: 'Model projectile trajectories using quadratic polynomials.',
      narrativeIntro: 'The physics lab connects with the mathematics wing. The board shows a telemetry trajectory for a meteorological sonde launched above Limbe coast.',
      subjectId: 'sub_math',
      difficulty: 'Advanced',
      xpReward: 200,
      pointReward: 80,
      estimatedMinutes: 7,
      requiredLevel: 2,
      type: 'multiple_choice',
      isDailyChallenge: 0,
      questions: [
        {
          id: 'q_mq_1',
          prompt: 'For the quadratic equation 2x² - 8x + 6 = 0, what are the roots for x?',
          contextText: 'Use the quadratic formula or factoring method: ax² + bx + c = 0.',
          type: 'multiple_choice',
          options: JSON.stringify(['x = 1 and x = 3', 'x = -1 and x = -3', 'x = 2 and x = 4', 'x = 0 and x = 3']),
          correctAnswer: 'x = 1 and x = 3',
          explanation: 'Dividing through by 2 gives x² - 4x + 3 = 0. Factoring: (x - 1)(x - 3) = 0, so x = 1 and x = 3.',
          orderNum: 1
        },
        {
          id: 'q_mq_2',
          prompt: 'What is the discriminant (Δ = b² - 4ac) of x² - 6x + 9 = 0 and what does it tell you about the roots?',
          contextText: 'Discriminant formula: Δ = b² - 4ac.',
          type: 'multiple_choice',
          options: JSON.stringify(['Δ = 0 (One real repeated root)', 'Δ > 0 (Two distinct real roots)', 'Δ < 0 (No real roots)', 'Δ = 36 (Infinite roots)']),
          correctAnswer: 'Δ = 0 (One real repeated root)',
          explanation: 'b² - 4ac = (-6)² - 4(1)(9) = 36 - 36 = 0. When Δ = 0, there is exactly one repeated real root (x = 3).',
          orderNum: 2
        }
      ]
    },
    // SCIENCE 1: Cell Respiration & Photosynthesis
    {
      id: 'mis_sci_cell',
      title: 'The Cellular Powerhouse',
      description: 'Analyze ATP synthesis, mitochondria efficiency, and photosynthetic electron transport.',
      narrativeIntro: 'You enter the Science Lab. Fluorescent lights reflect off clean glass beakers. Dr. Manga points to a transmission electron micrograph of plant leaf mesophyll.',
      subjectId: 'sub_sci',
      difficulty: 'Intermediate',
      xpReward: 160,
      pointReward: 65,
      estimatedMinutes: 6,
      requiredLevel: 1,
      type: 'multiple_choice',
      isDailyChallenge: 0,
      questions: [
        {
          id: 'q_sc_1',
          prompt: 'During aerobic cellular respiration, which organelle generates the vast majority of cellular ATP via oxidative phosphorylation?',
          contextText: 'Cellular respiration pathways.',
          type: 'multiple_choice',
          options: JSON.stringify(['Mitochondria', 'Endoplasmic Reticulum', 'Golgi Apparatus', 'Ribosome']),
          correctAnswer: 'Mitochondria',
          explanation: 'The mitochondria is known as the powerhouse of the cell because the electron transport chain and chemiosmosis on its inner cristae membrane produce approximately 30-32 ATP per glucose molecule.',
          orderNum: 1
        },
        {
          id: 'q_sc_2',
          prompt: 'What is the primary gaseous byproduct of the light-dependent reactions of photosynthesis in green plants?',
          contextText: 'Photolysis of water: 2H2O -> 4H+ + 4e- + O2.',
          type: 'multiple_choice',
          options: JSON.stringify(['Oxygen (O₂)', 'Carbon Dioxide (CO₂)', 'Nitrogen (N₂)', 'Methane (CH₄)']),
          correctAnswer: 'Oxygen (O₂)',
          explanation: 'In the thylakoid membrane, photolysis splits water molecules into hydrogen ions, electrons, and oxygen gas (O2), which is released into the atmosphere.',
          orderNum: 2
        }
      ]
    },
    // COMPUTER SCIENCE 1: Algorithms & Big-O
    {
      id: 'mis_cs_algo',
      title: 'Algorithm Complexity & Search',
      description: 'Evaluate time complexity of binary search vs linear search in distributed school records.',
      narrativeIntro: 'The Computer Lab hums with cooling fans. Dual monitors display sorting algorithms executing side-by-side. The instructor challenges you to optimize the student query engine.',
      subjectId: 'sub_cs',
      difficulty: 'Advanced',
      xpReward: 180,
      pointReward: 75,
      estimatedMinutes: 6,
      requiredLevel: 2,
      type: 'multiple_choice',
      isDailyChallenge: 0,
      questions: [
        {
          id: 'q_cs_1',
          prompt: 'Given an ordered array of 1,024 student ID numbers, what is the maximum number of comparisons Binary Search will execute in the worst-case scenario?',
          contextText: 'Binary Search cuts the search space in half at each iteration: log₂(N).',
          type: 'multiple_choice',
          options: JSON.stringify(['10 comparisons', '512 comparisons', '1,024 comparisons', '32 comparisons']),
          correctAnswer: '10 comparisons',
          explanation: 'Because log₂(1024) = 10, binary search requires at most 10 iterations to find any element or determine it is absent, compared to up to 1,024 for linear search.',
          orderNum: 1
        },
        {
          id: 'q_cs_2',
          prompt: 'Which data structure operates on a Last-In, First-Out (LIFO) principle and is commonly used for function call stacks and undo mechanisms?',
          contextText: 'Fundamental abstract data types.',
          type: 'multiple_choice',
          options: JSON.stringify(['Stack', 'Queue', 'Hash Table', 'Binary Heap']),
          correctAnswer: 'Stack',
          explanation: 'A Stack follows LIFO semantics where the last element pushed is the first to be popped, just like call frames in programming languages.',
          orderNum: 2
        }
      ]
    },
    // ENGLISH & LITERATURE: African Prose Comprehension
    {
      id: 'mis_eng_lit',
      title: 'Voices of African Prose',
      description: 'Analyze symbolism, oral tradition, and character agency in African literary masterpieces.',
      narrativeIntro: 'You sit in the Library literature nook surrounded by classical volumes. The proctor hands you an excerpt from Chinua Achebe’s Things Fall Apart and Ferdinand Oyono’s Houseboy.',
      subjectId: 'sub_eng',
      difficulty: 'Intermediate',
      xpReward: 150,
      pointReward: 55,
      estimatedMinutes: 5,
      requiredLevel: 1,
      type: 'comprehension',
      isDailyChallenge: 0,
      questions: [
        {
          id: 'q_eng_1',
          prompt: 'In Chinua Achebe’s Things Fall Apart, what does the recurring proverb "Proverbs are the palm-oil with which words are eaten" signify in Igbo cultural discourse?',
          contextText: 'Oral traditions and linguistic ornamentation in West African literature.',
          type: 'multiple_choice',
          options: JSON.stringify([
            'Proverbs make conversation smooth, rich, and culturally digestible.',
            'Palm oil is expensive and should be conserved.',
            'Words have physical taste and can be cooked.',
            'Only village elders are allowed to speak during meetings.'
          ]),
          correctAnswer: 'Proverbs make conversation smooth, rich, and culturally digestible.',
          explanation: 'Achebe uses this metaphor to show that proverbs are essential rhetorical seasoning that imbue conversation with wisdom, respect, and deep cultural resonance.',
          orderNum: 1
        },
        {
          id: 'q_eng_2',
          prompt: 'Which figure of speech is present in the sentence: "The Mount Fako wind whispered ancient secrets through the eucalyptus trees"?',
          contextText: 'Literary devices and stylistic analysis.',
          type: 'multiple_choice',
          options: JSON.stringify(['Personification', 'Hyperbole', 'Oxymoron', 'Synecdoche']),
          correctAnswer: 'Personification',
          explanation: 'Giving the non-human wind the human ability to "whisper secrets" is a classic example of personification.',
          orderNum: 2
        }
      ]
    },
    // PAN-AFRICAN & GENERAL KNOWLEDGE: Geography & Innovation
    {
      id: 'mis_gen_afro',
      title: 'Pan-African Innovations & Geography',
      description: 'Explore the Great Green Wall, African landmarks, and historical trade routes.',
      narrativeIntro: 'In the Social Studies hall, a giant holographic relief map of Africa illuminates the room, tracing the Nile, the Congo River basin, and the Sahelian climate belt.',
      subjectId: 'sub_gen',
      difficulty: 'Novice',
      xpReward: 130,
      pointReward: 50,
      estimatedMinutes: 4,
      requiredLevel: 1,
      type: 'multiple_choice',
      isDailyChallenge: 0,
      questions: [
        {
          id: 'q_gen_1',
          prompt: 'What is the monumental African ecological initiative spanning 8,000 km across the entire width of the Sahel from Senegal to Djibouti designed to combat desertification?',
          contextText: 'Ecological resilience and restoration across 20+ African nations.',
          type: 'multiple_choice',
          options: JSON.stringify(['The Great Green Wall', 'The Sahara Shield', 'The Savannah Canopy', 'The Nile Forest Belt']),
          correctAnswer: 'The Great Green Wall',
          explanation: 'The Great Green Wall is an African-led movement with the ambition to grow an 8,000km natural wonder of trees and fertile land across the Sahel to restore degraded ecosystems and create green jobs.',
          orderNum: 1
        },
        {
          id: 'q_gen_2',
          prompt: 'Which ancient African university founded in 859 AD in Fez, Morocco, is recognized by UNESCO and the Guinness World Records as the oldest existing, continually operating university in the world?',
          contextText: 'Pioneering institutions of higher learning.',
          type: 'multiple_choice',
          options: JSON.stringify(['University of al-Qarawiyyin', 'Al-Azhar University', 'Sankore University of Timbuktu', 'University of Alexandria']),
          correctAnswer: 'University of al-Qarawiyyin',
          explanation: 'Founded by Fatima al-Fihri in 859 AD, the University of al-Qarawiyyin in Fez is the oldest continuously operating degree-granting university on earth.',
          orderNum: 2
        }
      ]
    }
  ];

  for (const m of missionsData) {
    insertMission.run(
      m.id,
      m.title,
      m.description,
      m.narrativeIntro,
      m.subjectId,
      m.difficulty,
      m.xpReward,
      m.pointReward,
      m.estimatedMinutes,
      m.requiredLevel,
      m.type,
      m.isDailyChallenge
    );

    for (const q of m.questions) {
      insertQuestion.run(
        q.id,
        m.id,
        q.prompt,
        q.contextText || '',
        q.type,
        q.options,
        q.correctAnswer,
        q.explanation,
        q.orderNum
      );
    }
  }

  // 8. Opportunities & Scholarships
  const insertOpportunity = sqlite.prepare(`
    INSERT INTO opportunities (id, title, provider, type, description, requirements_summary, min_level, min_points, required_subject, required_min_score, required_badge_code, external_url, deadline, reward)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const opportunities = [
    {
      id: 'opp_stem_cameroon',
      title: 'National STEM Excellence Scholarship',
      provider: 'Cameroon Ministry of Higher Education & Tech Consortium',
      type: 'scholarship',
      description: 'Full tuition coverage and research stipend for top secondary school achievers pursuing engineering, biomedical sciences, or computational physics.',
      requirementsSummary: 'Level 10+, 400+ School Points, Science Explorer badge',
      minLevel: 10,
      minPoints: 400,
      requiredSubject: 'sub_sci',
      requiredMinScore: 80,
      requiredBadgeCode: 'sci_explorer',
      externalUrl: 'https://minesup.gov.cm/stem-scholarship',
      deadline: '2026-12-15',
      reward: '2,500,000 FCFA Full Tuition & Laptop'
    },
    {
      id: 'opp_math_olympiad',
      title: 'Pan-African Mathematics Olympiad Training Fellowship',
      provider: 'African Mathematical Union & UNESCO',
      type: 'fellowship',
      description: 'Intensive elite mathematical summer school hosted across regional centers with global research mentors and international competition sponsorship.',
      requirementsSummary: 'Level 12+, 500+ School Points, Mathematics Explorer badge',
      minLevel: 12,
      minPoints: 500,
      requiredSubject: 'sub_math',
      requiredMinScore: 85,
      requiredBadgeCode: 'math_explorer',
      externalUrl: 'https://pamo-maths.org/fellowship',
      deadline: '2026-11-30',
      reward: 'Fully-Funded Summer Institute & Research Grant'
    },
    {
      id: 'opp_ala_bootcamp',
      title: 'Young African Innovators Tech Bootcamp',
      provider: 'African Leadership Academy & Google Developers',
      type: 'bootcamp',
      description: 'A 6-week hands-on software development and venture incubator designed to build real solutions for African sustainable agriculture and health.',
      requirementsSummary: 'Level 8+, 300+ School Points, Coding Explorer badge',
      minLevel: 8,
      minPoints: 300,
      requiredSubject: 'sub_cs',
      requiredMinScore: 75,
      requiredBadgeCode: 'code_explorer',
      externalUrl: 'https://africanleadershipacademy.org/bootcamp',
      deadline: '2026-11-15',
      reward: 'Direct Mentorship, Cloud Credits & Hardware Kit'
    },
    {
      id: 'opp_green_leaders',
      title: 'Future Green Earth Environmental Prize',
      provider: 'Sahel Ecological Foundation',
      type: 'school_prize',
      description: 'School and student grant honoring youth-led reforestation, solar water purification, and bio-waste recycling initiatives.',
      requirementsSummary: 'Level 15+, 600+ School Points, 7-Day Streak badge',
      minLevel: 15,
      minPoints: 600,
      requiredSubject: 'sub_gen',
      requiredMinScore: 80,
      requiredBadgeCode: 'streak_7',
      externalUrl: 'https://sahelecology.org/green-prize',
      deadline: '2027-01-20',
      reward: '1,500,000 FCFA Project Seed Grant'
    },
    {
      id: 'opp_literature_merit',
      title: 'Wole Soyinka Commonwealth Book Prize',
      provider: 'Pan-African Writers Association',
      type: 'competition',
      description: 'Annual creative writing and analytical essay championship for secondary students across English and French speaking African regions.',
      requirementsSummary: 'Level 5+, 200+ School Points, Bookworm badge',
      minLevel: 5,
      minPoints: 200,
      requiredSubject: 'sub_eng',
      requiredMinScore: 70,
      requiredBadgeCode: 'bookworm',
      externalUrl: 'https://pawa-africa.org/youth-prize',
      deadline: '2026-12-01',
      reward: 'Published Anthology, Medallion & 500,000 FCFA'
    }
  ];

  for (const opp of opportunities) {
    insertOpportunity.run(
      opp.id,
      opp.title,
      opp.provider,
      opp.type,
      opp.description,
      opp.requirementsSummary,
      opp.minLevel,
      opp.minPoints,
      opp.requiredSubject,
      opp.requiredMinScore,
      opp.requiredBadgeCode,
      opp.externalUrl,
      opp.deadline,
      opp.reward
    );
  }

  // 9. Competitions & School Battles
  const insertCompetition = sqlite.prepare(`
    INSERT INTO competitions (id, title, subject_id, description, start_date, end_date, status, school1_id, school1_points, school2_id, school2_points, total_participants)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const competitions = [
    {
      id: 'comp_battle_fako',
      title: 'Battle of Mount Fako: Mathematics Derby',
      subjectId: 'sub_math',
      description: 'Bilingual Grammar School Molyko defends home turf against Sacred Heart College Bamenda in a high-stakes 7-day calculus and algebra sprint.',
      startDate: '2026-10-25',
      endDate: '2026-11-01',
      status: 'active',
      school1Id: 'sch_bgs_buea',
      school1Points: 7420,
      school2Id: 'sch_shc_bam',
      school2Points: 6980,
      totalParticipants: 142
    },
    {
      id: 'comp_stem_championship',
      title: 'Pan-African Science & Robotics Clash',
      subjectId: 'sub_sci',
      description: 'African Leadership Academy takes on Lycée Général Leclerc Yaoundé in cell biology, astrophysics, and clean tech simulations.',
      startDate: '2026-10-20',
      endDate: '2026-11-05',
      status: 'active',
      school1Id: 'sch_ala_jhb',
      school1Points: 8150,
      school2Id: 'sch_lgl_yao',
      school2Points: 6240,
      totalParticipants: 118
    },
    {
      id: 'comp_green_future',
      title: 'Atlantic Coastal Ecological Challenge',
      subjectId: 'sub_gen',
      description: 'Government High School Limbe challenges Achimota School Accra to develop the highest scoring coastal preservation project.',
      startDate: '2026-11-02',
      endDate: '2026-11-18',
      status: 'upcoming',
      school1Id: 'sch_ghs_lmb',
      school1Points: 5890,
      school2Id: 'sch_ach_acc',
      school2Points: 6120,
      totalParticipants: 94
    }
  ];

  for (const c of competitions) {
    insertCompetition.run(
      c.id,
      c.title,
      c.subjectId,
      c.description,
      c.startDate,
      c.endDate,
      c.status,
      c.school1Id,
      c.school1Points,
      c.school2Id,
      c.school2Points,
      c.totalParticipants
    );
  }

  // 10. Social Feed Initial Posts
  const insertFeed = sqlite.prepare(`
    INSERT INTO social_feed (id, student_id, type, title, subtitle, likes_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertFeed.run('feed_1', 'stud_sarah', 'level_up', 'Sarah reached Level 18!', '8,420 total XP unlocked in Upper Sixth at BGS Molyko.', 18, formatTime(30));
  insertFeed.run('feed_2', 'stud_emmanuel', 'badge_unlocked', 'Emmanuel earned the Mathematics Explorer badge 🧮', 'Solved 3 advanced calculus challenges flawlessly.', 14, formatTime(65));
  insertFeed.run('feed_3', 'stud_grace', 'streak_milestone', 'Grace hit a 14-Day Study Streak! 🔥', 'Consistent academic progress every single day.', 22, formatTime(120));
  insertFeed.run('feed_4', 'stud_amina', 'badge_unlocked', 'Amina unlocked Top 100 Champion 🏆', 'Climbed to rank #3 nationally across all high schools.', 29, formatTime(180));

  // 11. Initial Notifications for Sarah
  const insertNotification = sqlite.prepare(`
    INSERT INTO notifications (id, student_id, title, message, type, is_read, link)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotification.run('notif_1', 'stud_sarah', 'Mate Over Request', 'Amina Bello from African Leadership Academy sent you a Mate Over request.', 'mate_request', 0, '/mates');
  insertNotification.run('notif_2', 'stud_sarah', 'Opportunity Unlocked! 🎓', 'You meet all requirements for the National STEM Excellence Scholarship!', 'opportunity', 0, '/opportunities');
  insertNotification.run('notif_3', 'stud_sarah', 'School Battle Surge', 'BGS Molyko leads the Battle of Mount Fako by 440 points! Keep competing!', 'leaderboard', 1, '/campus');

  // 12. Teacher Assessment
  const insertAssessment = sqlite.prepare(`
    INSERT INTO teacher_assessments (id, teacher_id, teacher_name, title, school_id, subject_id, target_grade, questions, deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAssessment.run(
    'assess_math_midterm',
    'usr_teacher_fon',
    'Mr. Fon (Mathematics Department)',
    'Mid-Term Form 5 / Lower Sixth Calculus & Optimization Assessment',
    'sch_bgs_buea',
    'sub_math',
    'Upper Sixth (Grade 12)',
    JSON.stringify([
      {
        prompt: 'What is the first derivative of f(x) = 3x³ - 5x² + 7x - 12?',
        options: ['9x² - 10x + 7', '6x² - 10x + 7', '9x² - 5x + 7', '3x² - 10x'],
        correctAnswer: '9x² - 10x + 7',
        explanation: 'Using the power rule d/dx(x^n) = n*x^(n-1): 3*(3x^2) - 2*(5x) + 7 = 9x^2 - 10x + 7.'
      },
      {
        prompt: 'At what point does the parabola y = -x² + 6x - 5 achieve its maximum height?',
        options: ['x = 3, y = 4', 'x = -3, y = 4', 'x = 3, y = 9', 'x = 0, y = -5'],
        correctAnswer: 'x = 3, y = 4',
        explanation: 'The vertex of y = ax² + bx + c occurs at x = -b/(2a) = -6/(2 * -1) = 3. Substituting x = 3 yields y = -(9) + 18 - 5 = 4.'
      }
    ]),
    '2026-11-10'
  );

  // 13. Seed School Campuses and Interactive Buildings
  seedCampusBuildings();

  console.log('[SchoolVerse] Database seeded successfully with schools, students, missions, badges, and battles.');
}

export function seedCampusBuildings() {
  const existingBuildings = (sqlite.prepare('SELECT count(*) as count FROM campus_buildings').get() as { count: number }).count;
  if (existingBuildings > 0) return;

  const schools = sqlite.prepare('SELECT id, name, code FROM schools').all() as Array<{ id: string; name: string; code: string }>;
  const insertCampus = sqlite.prepare(`
    INSERT OR IGNORE INTO school_campuses (id, school_id, name, map_width, map_height, tile_size, spawn_x, spawn_y)
    VALUES (?, ?, ?, 60, 45, 32, 960, 1216)
  `);

  const insertBuilding = sqlite.prepare(`
    INSERT OR IGNORE INTO campus_buildings (
      id, school_id, name, code, category, subject_code,
      tile_x, tile_y, width_tiles, height_tiles, entrance_x, entrance_y,
      description, narrative_intro, door_label
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const buildingTemplates = [
    {
      code: 'SECURITY_GATE',
      name: 'Campus Main Gate & Security Post',
      category: 'gate',
      subjectCode: undefined,
      tileX: 27,
      tileY: 39,
      widthTiles: 6,
      heightTiles: 3,
      entranceX: 30,
      entranceY: 41,
      doorLabel: 'School Gate & Campus Boundary',
      description: 'The monumental gates and security checkpoint of the academy.',
      narrativeIntro: 'You stand at the historic campus gates. The security officers greet arriving scholars as buses and students stream in under the morning sky.'
    },
    {
      code: 'ADMIN_HQ',
      name: 'Administrative Building & Principal’s Office',
      category: 'admin',
      subjectCode: undefined,
      tileX: 25,
      tileY: 4,
      widthTiles: 10,
      heightTiles: 6,
      entranceX: 30,
      entranceY: 11,
      doorLabel: 'Administration & Honors Hall',
      description: 'Headquarters of academic records, faculty administration, and institutional discipline.',
      narrativeIntro: 'You enter the marble administration foyer. Trophies from national championships glitter behind glass display cabinets along the honors gallery.'
    },
    {
      code: 'MATH_CLASS',
      name: 'Mathematics Classroom',
      category: 'classroom',
      subjectCode: 'MATH',
      tileX: 5,
      tileY: 6,
      widthTiles: 8,
      heightTiles: 6,
      entranceX: 9,
      entranceY: 13,
      doorLabel: 'Room 101: Mathematics',
      description: 'Chalkboards covered with algebra, calculus trajectories, and Olympiad puzzles.',
      narrativeIntro: 'The rhythmic tap of chalk echoes as Mr. Fon diagrams quadratic roots on the blackboard. Students review formulas before the inter-school battle starts.'
    },
    {
      code: 'ENGLISH_CLASS',
      name: 'English & African Literature Classroom',
      category: 'classroom',
      subjectCode: 'ENG',
      tileX: 5,
      tileY: 16,
      widthTiles: 8,
      heightTiles: 6,
      entranceX: 9,
      entranceY: 23,
      doorLabel: 'Room 102: English & Literature',
      description: 'Dedicated to rhetoric, African literary comprehension, poetry, and essay critique.',
      narrativeIntro: 'You step into the literature room where quotes by Chinua Achebe, Wole Soyinka, and Mongo Beti line the walls. A lively debate on rhetorical devices is in progress.'
    },
    {
      code: 'SCIENCE_LAB',
      name: 'Natural Sciences Laboratory',
      category: 'classroom',
      subjectCode: 'SCI',
      tileX: 47,
      tileY: 6,
      widthTiles: 8,
      heightTiles: 6,
      entranceX: 51,
      entranceY: 13,
      doorLabel: 'Lab A: Chemistry & Biology',
      description: 'State-of-the-art laboratory stations for biochemistry, optics, and cell respiration experiments.',
      narrativeIntro: 'Glass beakers, burettes, and digital microscopes hum under crisp fluorescent lights. Dr. Manga inspects cell specimen slides prepared for the upcoming practical exams.'
    },
    {
      code: 'COMPUTER_LAB',
      name: 'Computer Science & Algorithm Lab',
      category: 'classroom',
      subjectCode: 'CS',
      tileX: 47,
      tileY: 16,
      widthTiles: 8,
      heightTiles: 6,
      entranceX: 51,
      entranceY: 23,
      doorLabel: 'Lab B: Coding & Networks',
      description: 'Computer terminals running algorithms, network topologies, and computational problem solvers.',
      narrativeIntro: 'The steady hum of high-performance towers fills the room. Students collaborate on algorithmic complexity charts and write code for the regional hackathon.'
    },
    {
      code: 'LIBRARY',
      name: 'Academy Central Library & Media Vault',
      category: 'facility',
      subjectCode: 'GEN',
      tileX: 5,
      tileY: 26,
      widthTiles: 8,
      heightTiles: 6,
      entranceX: 9,
      entranceY: 33,
      doorLabel: 'Central Library Archives',
      description: 'Extensive archival shelves, quiet research pods, and Pan-African historical collections.',
      narrativeIntro: 'Warm wooden stacks and reading lamps create an atmosphere of scholarly contemplation. Students work silently in comfortable leather study alcoves.'
    },
    {
      code: 'EXAM_HALL',
      name: 'Grand Examination & Competition Arena',
      category: 'facility',
      subjectCode: undefined,
      tileX: 47,
      tileY: 26,
      widthTiles: 8,
      heightTiles: 6,
      entranceX: 51,
      entranceY: 33,
      doorLabel: 'Examination Arena',
      description: 'The monumental examination hall where national standardized tests and school battles take place.',
      narrativeIntro: 'You step beneath the towering acoustic rafters. Desks are arranged in strict symmetrical ranks for inter-school academic tournaments.'
    },
    {
      code: 'CAFETERIA',
      name: 'Student Dining Hall & Cafeteria',
      category: 'facility',
      subjectCode: undefined,
      tileX: 16,
      tileY: 35,
      widthTiles: 8,
      heightTiles: 5,
      entranceX: 20,
      entranceY: 41,
      doorLabel: 'Cafeteria & Dining',
      description: 'Vibrant communal cafeteria serving fresh meals, snacks, and tropical juices.',
      narrativeIntro: 'Aromas of freshly baked bread and plantains drift through the open-air dining terrace. Friends gather across wide picnic tables sharing meals and conversation.'
    },
    {
      code: 'LOUNGE',
      name: 'Campus Student Lounge & Common Room',
      category: 'lounge',
      subjectCode: undefined,
      tileX: 36,
      tileY: 35,
      widthTiles: 8,
      heightTiles: 5,
      entranceX: 40,
      entranceY: 41,
      doorLabel: 'Student Common Lounge',
      description: 'Cozy modular seating, board games, notice boards, and student study circles.',
      narrativeIntro: 'The campus social hub buzzes with energy. Students exchange Mate Over cards, review leaderboard shifts, and relax between intense mission sessions.'
    },
    {
      code: 'SCHOLARSHIP_OFFICE',
      name: 'Scholarship & Opportunities Hub',
      category: 'scholarship',
      subjectCode: undefined,
      tileX: 17,
      tileY: 15,
      widthTiles: 6,
      heightTiles: 5,
      entranceX: 20,
      entranceY: 21,
      doorLabel: 'Opportunity & Fellowship Office',
      description: 'Dedicated guidance desk for STEM scholarships, international fellowships, and youth prizes.',
      narrativeIntro: 'Brochures and bulletins highlight fully-funded STEM grants and tech incubators. Academic advisors assist students in preparing milestone applications.'
    },
    {
      code: 'SPORTS_FIELD',
      name: 'Sports Complex & Athletic Field',
      category: 'field',
      subjectCode: undefined,
      tileX: 37,
      tileY: 14,
      widthTiles: 8,
      heightTiles: 6,
      entranceX: 41,
      entranceY: 21,
      doorLabel: 'Sports Pavilion & Track',
      description: 'Green athletic field with running track, basketball hoops, and spectator bleachers.',
      narrativeIntro: 'Cheers and basketball dribbles ring across the open green. Students practice track sprints and unwind with athletic games between classes.'
    }
  ];

  for (const s of schools) {
    const campusId = `camp_${s.id}`;
    insertCampus.run(campusId, s.id, `${s.name} Campus`);

    for (const b of buildingTemplates) {
      insertBuilding.run(
        `bld_${s.id}_${b.code}`,
        s.id,
        b.name,
        b.code,
        b.category,
        b.subjectCode || null,
        b.tileX,
        b.tileY,
        b.widthTiles,
        b.heightTiles,
        b.entranceX,
        b.entranceY,
        b.description,
        b.narrativeIntro,
        b.doorLabel
      );
    }
  }

  console.log('[SchoolVerse] Seeded campus environments and 12 interactive buildings for all schools.');
}

export function seedStudentCustomizations() {
  const insertCustomization = sqlite.prepare(`
    INSERT OR IGNORE INTO student_customization (student_id, skin_tone, hair_style, hair_color, uniform_style, accessory)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertCustomization.run('stud_sarah', 1, 'fade', '#171717', 'school', 'glasses');
  insertCustomization.run('stud_emmanuel', 2, 'puff', '#262626', 'emerald', 'watch');
  insertCustomization.run('stud_grace', 0, 'locs', '#171717', 'crimson', 'backpack');
  insertCustomization.run('stud_michael', 3, 'parted', '#451a03', 'amber', 'none');
  insertCustomization.run('stud_amina', 1, 'puff', '#171717', 'navy', 'headband');
}

initSchema();
seedData();
seedCampusBuildings();
seedStudentCustomizations();

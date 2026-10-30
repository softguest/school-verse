/**
 * SchoolVerse Progression, Gamification & Safety Calculations
 */

// Level thresholds: XP required to reach each level
export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  500,    // Level 2
  1000,   // Level 3
  1750,   // Level 4
  2500,   // Level 5
  3500,   // Level 6
  4750,   // Level 7
  6250,   // Level 8
  8000,   // Level 9
  10000,  // Level 10
  12500,  // Level 11
  15500,  // Level 12
  19000,  // Level 13
  23000,  // Level 14
  27500,  // Level 15
  32500,  // Level 16
  38000,  // Level 17
  44000,  // Level 18
  50500,  // Level 19
  57500,  // Level 20
];

/**
 * Reusable function to calculate student level from total XP.
 * Progression curve starts accessible and deepens as students progress.
 */
export function calculateLevelFromXP(xp: number): number {
  if (xp <= 0) return 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  // Formula for levels beyond 20
  const baseLvl20Xp = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const extraLevels = Math.floor((xp - baseLvl20Xp) / 8000);
  return 20 + extraLevels;
}

/**
 * Returns the XP threshold needed to reach the specified level.
 */
export function getXpThresholdForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level <= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[level - 1];
  }
  const baseLvl20Xp = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  return baseLvl20Xp + (level - 20) * 8000;
}

/**
 * Calculate progress details within the current level.
 */
export function getLevelProgress(xp: number) {
  const currentLevel = calculateLevelFromXP(xp);
  const currentLevelXp = getXpThresholdForLevel(currentLevel);
  const nextLevelXp = getXpThresholdForLevel(currentLevel + 1);
  const xpIntoLevel = Math.max(0, xp - currentLevelXp);
  const xpNeededForLevel = nextLevelXp - currentLevelXp;
  const percentage = Math.min(100, Math.round((xpIntoLevel / xpNeededForLevel) * 100));

  return {
    currentLevel,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel,
    xpNeededForLevel,
    xpRemaining: Math.max(0, nextLevelXp - xp),
    percentage,
  };
}

/**
 * Calculate Normalized School Score
 * Avoids raw point bias where schools with huge student counts dominate unfairly.
 * Formula balances:
 * - Average Student Performance (Weight 40%)
 * - Active Participation Rate (Weight 25%)
 * - Mission Completion Rate (Weight 20%)
 * - Competition Success (Weight 15%)
 */
export function calculateSchoolNormalizedScore(params: {
  totalPoints: number;
  studentCount: number;
  averageStudentXp: number;
  activeParticipationRate: number; // 0 to 1
  missionCompletionRate: number;    // 0 to 1
  competitionVictories: number;
}): number {
  const { studentCount, averageStudentXp, activeParticipationRate, missionCompletionRate, competitionVictories } = params;
  if (studentCount <= 0) return 0;

  // Normalized academic index (scale 0-1000)
  const academicScore = Math.min(1000, (averageStudentXp / 8000) * 1000) * 0.40;
  // Participation index (scale 0-1000)
  const participationScore = (activeParticipationRate * 1000) * 0.25;
  // Completion index (scale 0-1000)
  const completionScore = (missionCompletionRate * 1000) * 0.20;
  // Competition index (scale 0-1000)
  const competitionScore = Math.min(1000, competitionVictories * 200) * 0.15;

  const rawScore = academicScore + participationScore + completionScore + competitionScore;
  return Math.round(rawScore * 10) / 10;
}

/**
 * Student safety & moderation:
 * Filters profanity, sensitive contact exposure (phone numbers, private email addresses),
 * and harassing language to maintain a positive, safe student environment.
 */
const BANNED_WORDS = [
  'kill', 'die', 'murder', 'idiot', 'stupid', 'hate', 'loser', 'ass', 'bitch',
  'bastard', 'fuck', 'shit', 'crap', 'cunt', 'dick', 'pussy', 'whore', 'slut'
];

const PHONE_REGEX = /(\+?\d{1,4}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export function sanitizeChatMessage(text: string): { cleanText: string; isFlagged: boolean; reason?: string } {
  let cleanText = text;
  let isFlagged = false;
  let reason: string | undefined;

  // Check phone number leak
  if (PHONE_REGEX.test(cleanText)) {
    cleanText = cleanText.replace(PHONE_REGEX, '[PHONE REMOVED FOR SAFETY]');
    isFlagged = true;
    reason = 'Personal phone numbers cannot be shared in public chat for safety.';
  }

  // Check email leak
  if (EMAIL_REGEX.test(cleanText)) {
    cleanText = cleanText.replace(EMAIL_REGEX, '[EMAIL REMOVED FOR SAFETY]');
    isFlagged = true;
    reason = 'Personal email addresses cannot be shared in student chat.';
  }

  // Check banned words
  for (const word of BANNED_WORDS) {
    const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
    if (wordRegex.test(cleanText)) {
      cleanText = cleanText.replace(wordRegex, '***');
      isFlagged = true;
      reason = 'Inappropriate language is not permitted on SchoolVerse.';
    }
  }

  return { cleanText, isFlagged, reason };
}

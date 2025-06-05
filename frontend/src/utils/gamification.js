// XP thresholds for levels
export const LEVELS = [
  { name: "Novice", xp: 0 },
  { name: "Apprentice", xp: 100 },
  { name: "Professional", xp: 300 },
  { name: "Expert", xp: 700 },
  { name: "Master", xp: 1500 },
];

export function getLevel(xp) {
  let level = LEVELS[0];
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xp) level = LEVELS[i];
    else break;
  }
  return level;
}

export function getNextLevel(xp) {
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp < LEVELS[i].xp) return LEVELS[i];
  }
  return LEVELS[LEVELS.length - 1];
}

export const BADGES = [
  { key: "first_module", name: "First Module Complete" },
  { key: "quiz_master", name: "Quiz Master" },
  { key: "streak_champion", name: "Streak Champion" },
  { key: "code_reviewer", name: "Code Reviewer" },
];

export function getBadgeStatus(userBadges, badgeKey) {
  return userBadges && userBadges.includes(badgeKey);
}

export function getStreakReward(streak) {
  if (streak >= 365) return "365 Day Streak!";
  if (streak >= 100) return "100 Day Streak!";
  if (streak >= 30) return "30 Day Streak!";
  if (streak >= 7) return "7 Day Streak!";
  return null;
}

export const XP_VALUES = {
  moduleComplete: 20,
  quizComplete: 30,
  projectComplete: 50,
  streakDay: 2,
};

export function checkAndAwardBadges({ progress, quizzes, streak, badges }) {
  const unlocked = new Set(badges || []);
  if (progress && Object.keys(progress).length > 0) unlocked.add("first_module");
  if (quizzes && quizzes.length >= 5) unlocked.add("quiz_master");
  if (streak >= 7) unlocked.add("streak_champion");
  // Add more badge logic as needed
  return Array.from(unlocked);
}

export function getUpdatedXpAndBadges({ action, userData }) {
  let xp = userData.xp || 0;
  let badges = userData.badges || [];
  let progress = userData.progress || {};
  let quizzes = userData.quizzes || [];
  let streak = userData.streak || 0;
  if (action === "module") {
    xp += XP_VALUES.moduleComplete;
    badges = checkAndAwardBadges({ progress, quizzes, streak, badges });
  } else if (action === "quiz") {
    xp += XP_VALUES.quizComplete;
    badges = checkAndAwardBadges({ progress, quizzes: [...quizzes, {}], streak, badges });
  } else if (action === "project") {
    xp += XP_VALUES.projectComplete;
    // Add project badge logic if needed
    badges = checkAndAwardBadges({ progress, quizzes, streak, badges });
  }
  return { xp, badges };
} 
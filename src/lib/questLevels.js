// Level titles for the CodeQuest rank. The XP curve itself lives on the server
// (base44/shared/quest.ts): level 1 needs 100 XP and every level after it asks for 100 more.
// The server owns XP and hands the UI the numbers; this only names the rank a student holds.

export const LEVEL_NAMES = [
  "New Coder",
  "Code Explorer",
  "Logic Learner",
  "Bug Hunter",
  "Code Warrior",
  "Problem Solver",
  "Developer",
  "Advanced Developer",
  "Code Master",
  "Engineering Legend",
];

// Past the last named rank the curve keeps going, so the title keeps scaling with stars.
export const levelName = (level) => {
  const index = Math.max(0, Math.floor(Number(level) || 1) - 1);
  if (index < LEVEL_NAMES.length) return LEVEL_NAMES[index];
  return `${LEVEL_NAMES[LEVEL_NAMES.length - 1]}${" ★".repeat(Math.min(index - LEVEL_NAMES.length + 1, 3))}`;
};
import confetti from "canvas-confetti";

// Colours match the CodeQuest accents (XP, coins, gems, streak, success).
const GAME_COLORS = ["#6366f1", "#38bdf8", "#fbbf24", "#a855f7", "#22c55e"];

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// The "you won" moment: a short burst above the submit button.
export const celebrate = () => {
  if (prefersReducedMotion()) return;
  confetti({
    particleCount: 90,
    spread: 70,
    startVelocity: 42,
    origin: { x: 0.5, y: 0.7 },
    colors: GAME_COLORS,
    disableForReducedMotion: true,
  });
};

// A bigger, three-part burst for reaching a new level.
export const celebrateLevelUp = () => {
  if (prefersReducedMotion()) return;
  confetti({ particleCount: 150, spread: 100, startVelocity: 55, origin: { x: 0.5, y: 0.6 }, colors: GAME_COLORS, disableForReducedMotion: true });
  window.setTimeout(
    () => confetti({ particleCount: 70, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: GAME_COLORS, disableForReducedMotion: true }),
    200
  );
  window.setTimeout(
    () => confetti({ particleCount: 70, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: GAME_COLORS, disableForReducedMotion: true }),
    350
  );
};
// Encouragement and guidance for CodeQuest. Messages are picked at random on each win so
// students never see the same line twice in a row, and the guide explains the whole loop
// to a first-time player.

export const WIN_MESSAGES = [
  "Brilliant work — that idea is yours now.",
  "Solved! Your brain just levelled up.",
  "Clean work. Ready for the next one?",
  "Another one down — the momentum is real.",
  "Yes! That was a real programmer's move.",
  "Correct. You are getting faster at this.",
  "Locked in — you will recognise this pattern again.",
  "Well played. Keep the streak alive.",
  "Nice one — your future self thanks you.",
  "That looked easy for you.",
  "Another step on the map cleared.",
  "Sharp thinking. Let's keep going.",
];

export const BOSS_MESSAGES = [
  "BOSS CLEARED — you built something real from scratch.",
  "FINAL BOSS DEFEATED. That project is now proof you can build.",
  "Boss down! Put this project on your resume tonight.",
];

export const WRONG_MESSAGES = [
  "Not yet — read your output like a detective. One character can matter.",
  "Close. Every attempt teaches you something the answer alone never could.",
  "Wrong is just information. Take a hint and go again.",
  "Almost there. Compare your output with the expected output line by line.",
  "Deep breath. Break it into one small step and do just that step.",
  "Keep going — the third try is usually where it clicks.",
];

export const LEVEL_CLEARED_MESSAGES = [
  "Level cleared! That whole track is starting to make sense.",
  "Level complete — you are officially past this stage.",
  "Stage cleared! Next level unlocked.",
];

// Deterministic pick: same seed gives the same message, so a re-render does not flip it.
export const pickMessage = (list, seed = Date.now()) => {
  if (!Array.isArray(list) || list.length === 0) return "";
  const value = Math.abs(Math.floor(Number(seed) || 0));
  return list[value % list.length];
};

// How CodeQuest works, in the order a new student meets it.
export const GUIDE_STEPS = [
  {
    title: "1. Choose a language",
    body: "Six tracks — Python, JavaScript, Java, C++, C and SQL — each with 11 levels, from your very first program to a project you build yourself.",
  },
  {
    title: "2. Learn three short lessons",
    body: "Plain-English explanation, a real runnable example, something to try yourself, a practice question, the mistake beginners make here, and a mini challenge.",
  },
  {
    title: "3. Solve three challenges",
    body: "Each level ends with a quiz, a predict-the-output puzzle and a real coding task. Answers are checked instantly, and hints are there whenever you are stuck.",
  },
  {
    title: "4. Earn XP, coins and streaks",
    body: "Every lesson and challenge pays out XP. XP raises your level, coins add up, and practising on consecutive days grows your streak.",
  },
  {
    title: "5. Collect badges",
    body: "Thirteen badges are waiting — from First Steps and First Solve to Week Warrior and Quest Master.",
  },
  {
    title: "6. Beat the Final Boss",
    body: "Level 11 of every track is a capstone project. Build it, test it, mark it done, and that track is finished.",
  },
];
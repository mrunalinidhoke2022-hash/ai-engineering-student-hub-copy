import { Award, Code2, Flame, Rocket, Star, Target, Trophy } from "lucide-react";

// Human labels for stored challenge types. The stored value never changes.
export const CHALLENGE_TYPE_LABELS = {
  multiple_choice: "Multiple choice",
  predict_output: "Predict the output",
  fix_bug: "Fix the bug",
  complete_code: "Complete the code",
  write_code: "Write the code",
  optimize_code: "Optimize the code",
  debug_program: "Debug the program",
  build_function: "Build a function",
  build_mini_app: "Build a mini application",
};

// Types the server can grade on its own, without running student code.
export const AUTO_GRADED_TYPES = ["multiple_choice", "predict_output", "fix_bug", "complete_code"];

export const TYPE_OPTIONS = Object.keys(CHALLENGE_TYPE_LABELS);
export const TIERS = ["Beginner", "Intermediate", "Advanced", "Expert"];
export const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard", "Expert"];

export const DIFFICULTY_CLASSES = {
  Easy: "bg-success/10 text-success",
  Medium: "bg-warning/10 text-warning",
  Hard: "bg-warning/15 text-warning",
  Expert: "bg-destructive/10 text-destructive",
};

export const ACHIEVEMENT_ICONS = {
  trophy: Trophy,
  code: Code2,
  flame: Flame,
  star: Star,
  rocket: Rocket,
  target: Target,
  award: Award,
};

export const ACHIEVEMENT_ICON_KEYS = Object.keys(ACHIEVEMENT_ICONS);

// The standard progression every language starts from; admins can edit or extend it.
export const DEFAULT_LEVEL_TRACK = [
  { order: 1, title: "Welcome Coder", tier: "Beginner", focus: "Set up the tools and run your first program.", topics: ["Setup", "First program", "How code runs"] },
  { order: 2, title: "Variables", tier: "Beginner", focus: "Storing and naming data.", topics: ["Variables", "Naming", "Assignment"] },
  { order: 3, title: "Conditions", tier: "Beginner", focus: "Making the program decide.", topics: ["if / else", "Comparisons", "Logic"] },
  { order: 4, title: "Loops", tier: "Beginner", focus: "Repeating work without repeating code.", topics: ["for", "while", "Loop control"] },
  { order: 5, title: "Functions", tier: "Intermediate", focus: "Reusable blocks of logic.", topics: ["Defining", "Parameters", "Return values"] },
  { order: 6, title: "Arrays & Collections", tier: "Intermediate", focus: "Working with many values at once.", topics: ["Lists", "Indexing", "Iteration"] },
  { order: 7, title: "Strings", tier: "Intermediate", focus: "Handling text properly.", topics: ["Text basics", "Formatting", "Common operations"] },
  { order: 8, title: "Advanced Concepts", tier: "Advanced", focus: "References, memory and safe failure.", topics: ["References", "Memory", "Error handling"] },
  { order: 9, title: "Data Structures", tier: "Advanced", focus: "Choosing the right container.", topics: ["Stacks & queues", "Maps", "Trees"] },
  { order: 10, title: "Algorithms", tier: "Expert", focus: "Searching, sorting and cost.", topics: ["Searching", "Sorting", "Complexity"] },
  { order: 11, title: "Final Boss — Build a Real Project", tier: "Expert", focus: "Plan, build, test and ship something real.", topics: ["Planning", "Building", "Testing", "Shipping"] },
];

export const isBossLevel = (level) => level?.tier === "Expert" && /final boss/i.test(level?.title || "");
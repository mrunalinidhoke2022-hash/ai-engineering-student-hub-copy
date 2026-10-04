import { ACHIEVEMENT_ICON_KEYS, DEFAULT_LEVEL_TRACK } from "@/components/quest/questLabels";

export const EMPTY_LANGUAGE = {
  name: "",
  slug: "",
  tagline: "",
  overview: "",
  where_used: "",
  setup_guide: "",
  levels: [],
  enabled: true,
  sort_order: 0,
};

export const EMPTY_LESSON = {
  language_slug: "",
  level_order: 1,
  title: "",
  order: 0,
  summary: "",
  explanation: "",
  real_world_example: "",
  code_example: "",
  try_it: "",
  practice_question: "",
  common_mistake: "",
  hint: "",
  solution_explanation: "",
  mini_challenge: "",
  xp_reward: 20,
  published: true,
};

export const EMPTY_CHALLENGE = {
  language_slug: "",
  level_order: 1,
  title: "",
  type: "multiple_choice",
  difficulty: "Easy",
  topic: "",
  problem: "",
  expected_input: "",
  expected_output: "",
  constraints: "",
  example: "",
  starter_code: "",
  options: [],
  test_cases: [],
  hints: [],
  xp_reward: 30,
  published: true,
};

export const EMPTY_SOLUTION = { answer: "", accepted_answers: [], explanation: "", hidden_tests: [] };

export const EMPTY_BADGE = {
  key: "",
  name: "",
  description: "",
  icon: ACHIEVEMENT_ICON_KEYS[0],
  criteria_type: "xp_total",
  criteria_value: 100,
  xp_reward: 50,
  enabled: true,
};

export const ICON_KEYS = ACHIEVEMENT_ICON_KEYS;
export const STANDARD_TRACK = DEFAULT_LEVEL_TRACK;

// List fields are edited as plain text, one entry per line.
export const textToList = (value, limit = 12) =>
  String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, limit);

export const listToText = (value) => (Array.isArray(value) ? value.join("\n") : "");

export const commaToTopics = (value) =>
  String(value || "")
    .split(",")
    .map((topic) => topic.trim())
    .filter(Boolean)
    .slice(0, 12);

export const topicsToComma = (value) => (Array.isArray(value) ? value.join(", ") : "");

// Test cases are edited as "input => expected output", one per line.
export const testsToText = (value) =>
  (Array.isArray(value) ? value : []).map((test) => `${test.input || ""} => ${test.expected_output || ""}`).join("\n");

export const textToTests = (value) =>
  String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((line) => {
      const [input, expected] = line.split("=>");
      return { input: (input || "").trim(), expected_output: (expected || "").trim(), visible: true };
    });
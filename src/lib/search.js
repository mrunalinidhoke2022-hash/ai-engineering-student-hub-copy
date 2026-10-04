import { base44 } from "@/api/base44Client";
import { QUICK_TOPICS } from "@/data/quickTopics";

// A search reads nine collections, so every result set is cached briefly: typing,
// backspacing or reopening the dialog reuses the same answer instead of making
// another round of requests (which is what trips the API rate limit).
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_LIMIT = 40;
const resultCache = new Map();

function readCache(key) {
  const hit = resultCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    resultCache.delete(key);
    return null;
  }
  return hit.value;
}

function writeCache(key, value) {
  if (resultCache.size >= CACHE_LIMIT) resultCache.delete(resultCache.keys().next().value);
  resultCache.set(key, { at: Date.now(), value });
}

// Every destination in the app, so any search can always offer somewhere to go.
export const PAGES = [
  { title: "Home", subtitle: "Search, quick topics and the whole platform in one view", to: "/", keywords: "home start overview index" },
  { title: "AI Tools Directory", subtitle: "Browse every listed AI tool by category", to: "/ai-tools", keywords: "tools directory ai list" },
  { title: "Tool Finder", subtitle: "Get tool suggestions for a goal you describe", to: "/tool-finder", keywords: "finder recommend match suggestion" },
  { title: "Learn", subtitle: "Learning paths and study roadmaps", to: "/learn", keywords: "learn study path roadmap course" },
  { title: "Coding Practice", subtitle: "Problems filtered by language, topic and difficulty", to: "/coding-practice", keywords: "problems dsa practice interview" },
  { title: "CodeQuest", subtitle: "Level-based learning game with XP and badges", to: "/codequest", keywords: "quest xp level game badge streak gamified" },
  { title: "Leaderboard", subtitle: "Top coders ranked by solved problems", to: "/leaderboard", keywords: "leaderboard rank top students score" },
  { title: "Hackathon Hub", subtitle: "Problem statements, prep guides and build plans", to: "/hackathon-hub", keywords: "hackathon competition event problem statement" },
  { title: "Project Builder", subtitle: "Turn an idea into a step-by-step project roadmap", to: "/project-builder", keywords: "project roadmap plan idea build generator" },
  { title: "Prompt Library", subtitle: "Copy-paste prompts for study and building", to: "/prompts", keywords: "prompt library chatgpt template" },
  { title: "AI Mentor", subtitle: "Ask questions and get your code reviewed", to: "/mentor", keywords: "mentor doubt help review explain ai" },
  { title: "My Toolkit", subtitle: "Everything you saved across the platform", to: "/toolkit", keywords: "saved bookmark toolkit collection" },
  { title: "Dashboard", subtitle: "Your progress, activity and next steps", to: "/dashboard", keywords: "dashboard progress stats activity summary" },
  { title: "Find a Team", subtitle: "Join a team or start your own", to: "/team", keywords: "team members join recruit group" },
  { title: "Workspace", subtitle: "Team board, tasks and discussions", to: "/workspace", keywords: "workspace kanban board tasks team chat" },
  { title: "Profile", subtitle: "Identity, security and learning preferences", to: "/profile", keywords: "profile account settings password security" },
  { title: "Admin", subtitle: "Manage tools, content, quests and updates", to: "/admin", keywords: "admin manage moderation content publish" },
  { title: "Privacy Policy", subtitle: "What we collect and how it is used", to: "/privacy", keywords: "privacy policy data gdpr legal" },
  { title: "Terms of Use", subtitle: "The rules for using DEVLAUNCH", to: "/terms", keywords: "terms conditions rules legal agreement" },
];

export function searchPages(query, limit = 6) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return PAGES.filter((page) =>
    [page.title, page.subtitle, page.keywords].some((text) => text.toLowerCase().includes(needle))
  )
    .slice(0, limit)
    .map((page) => ({ id: page.to, title: page.title, subtitle: page.subtitle, to: page.to }));
}

export function searchGuides(query, limit = 6) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return QUICK_TOPICS.filter((topic) =>
    [topic.title, topic.chip, topic.tagline, topic.what].some((text) => (text || "").toLowerCase().includes(needle))
  )
    .slice(0, limit)
    .map((topic) => ({ id: topic.slug, title: topic.title, subtitle: topic.tagline, to: `/guide/${topic.slug}` }));
}

/**
 * One search across everything the student can reach: tools, coding content,
 * CodeQuest lessons and challenges, prompts, paths, hackathon statements,
 * announcements, guides and pages. Each lookup is independent, so a restricted
 * or failing one simply contributes nothing instead of breaking the search.
 */
export async function runSearch(rawQuery) {
  const query = (rawQuery || "").trim();
  if (!query) return { groups: [], total: 0 };

  const cacheKey = query.toLowerCase();
  const cached = readCache(cacheKey);
  if (cached) return cached;

  const regex = { $regex: query, $options: "i" };
  let failed = 0;
  const grab = (promise) =>
    promise
      .then((page) => page?.items || [])
      .catch(() => {
        failed += 1;
        return [];
      });

  const [tools, problems, languages, lessons, challenges, prompts, paths, statements, announcements] = await Promise.all([
    grab(base44.entities.Tool.filter({ $or: [{ name: regex }, { description: regex }, { tags: regex }] }, { limit: 6 })),
    grab(base44.entities.CodingProblem.filter({ $or: [{ title: regex }, { topic: regex }, { language: regex }] }, { limit: 6 })),
    grab(base44.entities.ProgrammingLanguage.filter({ $or: [{ name: regex }, { tagline: regex }, { overview: regex }] }, { limit: 6 })),
    grab(base44.entities.Lesson.filter({ published: true, $or: [{ title: regex }, { summary: regex }] }, { limit: 6 })),
    grab(base44.entities.CodingChallenge.filter({ published: true, $or: [{ title: regex }, { topic: regex }] }, { limit: 6 })),
    grab(base44.entities.Prompt.filter({ $or: [{ title: regex }, { prompt_text: regex }, { category: regex }] }, { limit: 6 })),
    grab(base44.entities.LearningPath.filter({ $or: [{ title: regex }, { description: regex }] }, { limit: 6 })),
    grab(base44.entities.ProblemStatement.filter({ $or: [{ title: regex }, { description: regex }] }, { limit: 6 })),
    grab(base44.entities.Announcement.filter({ $or: [{ title: regex }, { message: regex }] }, { limit: 6 })),
  ]);

  const guideMatches = searchGuides(query);
  const pageMatches = searchPages(query);

  const groups = [
    {
      key: "pages",
      title: "Go to",
      items: pageMatches,
    },
    {
      key: "tools",
      title: "AI Tools",
      items: tools.map((tool) => ({ id: tool.id, title: tool.name, subtitle: tool.description, to: `/ai-tools/${tool.slug}` })),
    },
    {
      key: "languages",
      title: "CodeQuest Languages",
      items: languages.map((language) => ({
        id: language.id,
        title: language.name,
        subtitle: language.tagline,
        to: `/codequest/${language.slug}/1`,
      })),
    },
    {
      key: "lessons",
      title: "CodeQuest Lessons",
      items: lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        subtitle: lesson.summary || `${lesson.language_slug} · level ${lesson.level_order}`,
        to: `/codequest/${lesson.language_slug}/${lesson.level_order}`,
      })),
    },
    {
      key: "challenges",
      title: "CodeQuest Challenges",
      items: challenges.map((challenge) => ({
        id: challenge.id,
        title: challenge.title,
        subtitle: `${challenge.language_slug} · ${challenge.topic || challenge.difficulty || ""}`.trim(),
        to: `/codequest/challenge/${challenge.id}`,
      })),
    },
    {
      key: "problems",
      title: "Coding Problems",
      items: problems.map((problem) => ({
        id: problem.id,
        title: problem.title,
        subtitle: `${problem.language} · ${problem.topic} · ${problem.difficulty}`,
        to: `/coding-practice/${problem.id}`,
      })),
    },
    {
      key: "guides",
      title: "Guides",
      items: guideMatches,
    },
    {
      key: "prompts",
      title: "Prompts",
      items: prompts.map((prompt) => ({ id: prompt.id, title: prompt.title, subtitle: prompt.prompt_text, to: "/prompts" })),
    },
    {
      key: "hackathons",
      title: "Hackathon Problem Statements",
      items: statements.map((statement) => ({ id: statement.id, title: statement.title, subtitle: statement.description, to: "/hackathon-hub" })),
    },
    {
      key: "paths",
      title: "Learning Paths",
      items: paths.map((path) => ({ id: path.id, title: path.title, subtitle: path.description, to: "/learn" })),
    },
    {
      key: "announcements",
      title: "Announcements",
      items: announcements.map((item) => ({ id: item.id, title: item.title, subtitle: item.message, to: "/" })),
    },
  ].filter((group) => group.items.length > 0);

  const result = {
    groups,
    total: groups.reduce((sum, group) => sum + group.items.length, 0),
    failed,
  };
  // Only a complete search is remembered — a partially failed one is retried next time.
  if (failed === 0) writeCache(cacheKey, result);
  return result;
}
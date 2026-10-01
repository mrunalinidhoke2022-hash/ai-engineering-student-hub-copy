import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const LABELS = [
  ["/ai-tools", "AI Tools Directory"],
  ["/tool-finder", "Tool Finder"],
  ["/learn", "Learning Paths"],
  ["/coding-practice", "Coding Practice"],
  ["/hackathon-hub", "Hackathon Center"],
  ["/project-builder", "Project Roadmap Builder"],
  ["/prompts", "Prompt Library"],
  ["/mentor", "AI Mentor Chat"],
  ["/dashboard", "Dashboard"],
  ["/toolkit", "My Toolkit"],
  ["/profile", "Profile"],
  ["/admin", "Admin Dashboard"],
  ["/team", "Team Page"],
];

const loggedThisSession = new Set();

const labelFor = (pathname) => {
  const match = LABELS.find(([prefix]) => pathname.startsWith(prefix));
  return match ? match[1] : "Home";
};

export default function ActivityTracker({ user }) {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!user?.id || loggedThisSession.has(pathname)) return;
    loggedThisSession.add(pathname);
    base44.entities.Activity.create({
      student: user.full_name || user.email,
      action: labelFor(pathname),
      path: pathname,
    }).catch(() => {});
  }, [pathname, user?.id]);

  return null;
}
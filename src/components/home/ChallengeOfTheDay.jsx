import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Everyone sees the same beginner problem for the whole day; it rotates at midnight.
const dayOfYear = () => {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - yearStart) / 86400000);
};

export default function ChallengeOfTheDay() {
  const [problem, setProblem] = useState(null);
  const { t } = useLanguage();

  useEffect(() => {
    base44.entities.CodingProblem.filter(
      { difficulty: "Beginner" },
      { sort: "created_date", limit: 100, fields: ["title", "language"] }
    ).then((page) => {
      const items = page.items || [];
      if (items.length) setProblem(items[dayOfYear() % items.length]);
    });
  }, []);

  // Nothing to challenge yet — stay out of the way.
  if (!problem) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="font-heading font-bold text-sm flex items-center gap-2">
        <Code2 className="w-4 h-4 text-primary" /> {t("home.challengeTitle")}
      </h3>
      <p className="font-semibold text-sm mt-2">{problem.title}</p>
      <div className="flex items-center justify-between gap-2 mt-3">
        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-accent text-accent-foreground">{problem.language}</span>
        <Link to={`/coding-practice/${problem.id}`}>
          <Button size="sm">{t("home.challengeCta")}</Button>
        </Link>
      </div>
    </div>
  );
}
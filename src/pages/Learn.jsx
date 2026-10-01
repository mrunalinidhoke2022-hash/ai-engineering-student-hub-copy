import React, { useEffect, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import FilterChips from "@/components/common/FilterChips";
import EmptyState from "@/components/common/EmptyState";
import BookmarkButton from "@/components/tools/BookmarkButton";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const CATEGORIES = ["Web Development", "AI/ML", "Programming Basics", "First Year Engineering", "Mobile Development", "Data Science"];

export default function Learn() {
  const [paths, setPaths] = useState([]);
  const [category, setCategory] = useState("");
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t, term } = useLanguage();

  useEffect(() => {
    setLoading(true);
    const query = category ? { category } : {};
    base44.entities.LearningPath.filter(query, { sort: "title", limit: 40 })
      .then((page) => setPaths(page.items))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-heading font-extrabold text-3xl">{t("learn.title")}</h1>
      <p className="text-muted-foreground mt-1">{t("learn.subtitle")}</p>

      <div className="mt-6">
        <FilterChips options={CATEGORIES} value={category} onChange={setCategory} allLabel={t("learn.allPaths")} labelFor={term} />
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("learn.loading")}</p>
        ) : paths.length === 0 ? (
          <EmptyState title={t("learn.emptyTitle")} />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {paths.map((path) => (
              <button key={path.id} onClick={() => setActive(path)} className="text-left bg-card border border-border rounded-lg p-5 hover:border-primary/40">
                <span className="text-xs font-semibold text-primary">{term(path.category)}</span>
                <h3 className="font-heading font-bold text-lg mt-1">{path.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{path.description}</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary mt-3">
                  {t("learn.steps", { count: path.steps?.length || 0 })} <ChevronRight className="w-4 h-4" />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setActive(null)}>
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-primary">{term(active.category)} · {term(active.level)}</span>
                <h2 className="font-heading font-bold text-2xl mt-1">{active.title}</h2>
              </div>
              <button onClick={() => setActive(null)} className="p-1"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">{active.description}</p>
            <ol className="mt-5 space-y-3">
              {(active.steps || []).map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-accent text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <div>
                    <p className="font-semibold text-sm">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6">
              <BookmarkButton itemType="learning_path" itemId={active.id} itemName={active.title} folder="Research" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
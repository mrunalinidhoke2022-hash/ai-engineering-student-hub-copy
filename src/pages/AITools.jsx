import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import ToolCard from "@/components/tools/ToolCard";
import FilterChips from "@/components/common/FilterChips";
import EmptyState from "@/components/common/EmptyState";
import PageMeta from "@/components/common/PageMeta";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import useSavedBookmarks from "@/hooks/useSavedBookmarks";
import PullToRefresh from "@/components/common/PullToRefresh";

const CATEGORIES = ["General AI", "Coding", "Research", "Design", "Presentations", "Image Generation", "Video Generation", "Audio", "Writing", "Productivity", "Data Science", "Developer Tools", "Cloud"];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];

export default function AITools() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const { isSaved, toggle } = useSavedBookmarks("tool", tools, "My AI Tools");
  const { t, term } = useLanguage();

  const load = () => {
    setLoading(true);
    const query = {};
    if (category) query.category = category;
    if (level) query.level = level;
    if (search.trim()) query.name = { $regex: search.trim(), $options: "i" };
    return base44.entities.Tool.filter(query, { sort: "name", limit: 60 })
      .then((page) => setTools(page.items))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [search, category, level]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <PageMeta
        title="AI Tools Directory for Engineering Students | Engineering Hub"
        description="Free and freemium AI tools for coding, research, design and presentations — each one reviewed with beginner tutorials and example prompts."
      />
      <PullToRefresh onRefresh={load} />
      <h1 className="font-heading font-extrabold text-3xl">{t("aitools.title")}</h1>
      <p className="text-muted-foreground mt-1">{t("aitools.subtitle")}</p>

      <div className="mt-6 flex items-center gap-2 bg-background border border-border rounded-lg p-2 max-w-lg">
        <Search className="w-4 h-4 text-muted-foreground ml-2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("aitools.searchPlaceholder")}
          className="flex-1 outline-none text-sm py-1.5"
        />
      </div>

      <div className="mt-4 space-y-3">
        <FilterChips options={CATEGORIES} value={category} onChange={setCategory} allLabel={t("aitools.allCategories")} labelFor={term} />
        <FilterChips options={LEVELS} value={level} onChange={setLevel} allLabel={t("aitools.allLevels")} labelFor={term} />
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("aitools.loading")}</p>
        ) : tools.length === 0 ? (
          <EmptyState title={t("aitools.emptyTitle")} description={t("aitools.emptyDesc")} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} saved={isSaved(tool.id)} onToggle={toggle} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
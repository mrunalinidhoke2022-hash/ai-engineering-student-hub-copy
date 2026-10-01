import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Sparkles, Trophy, Hammer, MessageCircle, ArrowRight, Wrench, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import ShowcaseStrip from "@/components/home/ShowcaseStrip";
import { QUICK_TOPICS } from "@/data/quickTopics";

export default function Home() {
  const [query, setQuery] = useState("");
  const [tools, setTools] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [toolCount, setToolCount] = useState(0);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    base44.entities.Tool.list({ limit: 4, sort: "-created_date" }).then((p) => setTools(p.items));
    base44.entities.Prompt.list({ limit: 3 }).then((p) => setPrompts(p.items));
    base44.entities.Tool.count({}).then(setToolCount);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div>
      {/* HERO */}
      <section className="relative bg-[#0F172A] text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.06]" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-20 lg:pt-24 lg:pb-28 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-400/30 rounded-full px-3 py-1 mb-6">
            <Sparkles className="w-3.5 h-3.5" /> {t("home.badge")}
          </span>
          <h1 className="font-heading font-extrabold tracking-tight" style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}>
            {t("home.title1")}
            <br />
            {t("home.title2")}
          </h1>
          <p className="mt-5 text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">{t("home.subtitle")}</p>

          <form onSubmit={submitSearch} className="mt-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 bg-white rounded-xl p-2 shadow-lg">
              <Search className="w-5 h-5 text-muted-foreground ml-2 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("home.searchPlaceholder")}
                className="flex-1 bg-transparent outline-none text-foreground text-sm sm:text-base px-1 py-2"
              />
              <Button type="submit" className="shrink-0">
                {t("home.search")}
              </Button>
            </div>
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 justify-center flex-wrap">
              {QUICK_TOPICS.map((topic) => (
                <Link
                  key={topic.slug}
                  to={`/guide/${topic.slug}`}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-slate-200 hover:bg-white/20 whitespace-nowrap"
                >
                  {topic.chip}
                </Link>
              ))}
            </div>
          </form>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/ai-tools">
              <Button size="lg" className="gap-2">
                {t("home.exploreTools")} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/tool-finder">
              <Button size="lg" variant="secondary" className="gap-2 bg-white/10 text-white border border-white/20 hover:bg-white/20">
                {t("home.startJourney")}
              </Button>
            </Link>
            <Link to="/hackathon-hub">
              <Button size="lg" variant="secondary" className="gap-2 bg-white/10 text-white border border-white/20 hover:bg-white/20">
                {t("home.hackathonCenter")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <ShowcaseStrip />

      {/* BENTO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-heading font-bold text-xl flex items-center gap-2"><Wrench className="w-5 h-5 text-primary" /> {t("home.toolsDirectory")}</h2>
                  <p className="text-sm text-muted-foreground">{t("home.toolsCount", { count: toolCount })}</p>
                </div>
                <Link to="/ai-tools" className="text-sm font-semibold text-primary hidden sm:inline">{t("home.viewAll")}</Link>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {tools.map((tool) => (
                  <Link key={tool.id} to={`/ai-tools/${tool.slug}`} className="border border-border rounded-lg p-3 hover:border-primary/40 transition-colors">
                    <p className="font-semibold text-sm">{tool.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{tool.description}</p>
                  </Link>
                ))}
              </div>
            </div>

            <Link to="/tool-finder" className="block bg-card border border-border rounded-lg p-6 hover:border-primary/40 transition-colors">
              <h2 className="font-heading font-bold text-xl flex items-center gap-2"><Compass className="w-5 h-5 text-primary" /> {t("home.finderTitle")}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t("home.finderDesc")}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary mt-3">{t("home.finderCta")} <ArrowRight className="w-4 h-4" /></span>
            </Link>

            <Link to="/hackathon-hub" className="block bg-card border border-border rounded-lg p-6 hover:border-primary/40 transition-colors">
              <h2 className="font-heading font-bold text-xl flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /> {t("home.hackathonTitle")}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t("home.hackathonDesc")}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary mt-3">{t("home.hackathonCta")} <ArrowRight className="w-4 h-4" /></span>
            </Link>

            <Link to="/project-builder" className="block bg-card border border-border rounded-lg p-6 hover:border-primary/40 transition-colors">
              <h2 className="font-heading font-bold text-xl flex items-center gap-2"><Hammer className="w-5 h-5 text-primary" /> {t("home.roadmapTitle")}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t("home.roadmapDesc")}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary mt-3">{t("home.roadmapCta")} <ArrowRight className="w-4 h-4" /></span>
            </Link>
          </div>

          <div className="space-y-6">
            <Link to="/mentor" className="block bg-[#0F172A] text-white rounded-lg p-6 hover:opacity-95 transition-opacity">
              <h3 className="font-heading font-bold flex items-center gap-2"><MessageCircle className="w-4 h-4 text-indigo-300" /> {t("home.mentorTitle")}</h3>
              <p className="text-sm text-slate-300 mt-1">{t("home.mentorDesc")}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-300 mt-3">{t("home.mentorCta")} <ArrowRight className="w-4 h-4" /></span>
            </Link>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-heading font-bold text-sm mb-3">{t("home.promptsTitle")}</h3>
              <div className="space-y-2">
                {prompts.map((p) => (
                  <div key={p.id} className="text-sm border border-border rounded-md p-2.5">
                    <p className="font-semibold text-xs text-primary">{p.category}</p>
                    <p className="text-muted-foreground line-clamp-2 text-xs mt-0.5">{p.prompt_text}</p>
                  </div>
                ))}
              </div>
              <Link to="/prompts" className="text-sm font-semibold text-primary mt-3 inline-flex items-center gap-1">{t("home.browseLibrary")} <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-heading font-bold text-sm mb-2">{t("home.progressTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("home.progressDesc")}</p>
              <Link to="/dashboard" className="text-sm font-semibold text-primary mt-3 inline-flex items-center gap-1">{t("home.goToDashboard")} <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
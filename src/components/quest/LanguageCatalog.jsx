import React, { useState } from "react";
import LanguageCard, { isTrackReady } from "./LanguageCard";

// Every supported language sits in one of these groups, so the catalogue keeps working
// as more languages (and more curriculum) are added.
const CATEGORY_ORDER = [
  { name: "Web", icon: "🌐" },
  { name: "Mobile", icon: "📱" },
  { name: "AI/Data", icon: "🤖" },
  { name: "Backend", icon: "☁️" },
  { name: "Systems", icon: "⚙️" },
  { name: "Database", icon: "🗄️" },
  { name: "Scientific", icon: "🔬" },
  { name: "Game Development", icon: "🎮" },
  { name: "Scripting", icon: "🛠️" },
  { name: "Low-Level", icon: "💻" },
];

export default function LanguageCatalog({ languages, progress, activeSlug, onOpen }) {
  const [previewSlug, setPreviewSlug] = useState("");
  const popular = languages.filter((language) => language.popular);

  // Popular chips jump straight into a playable track; a track still being written opens its
  // roadmap preview on its card instead of leading into an empty level map.
  const jumpTo = (language) => {
    if (isTrackReady(language)) {
      onOpen(language.slug);
      return;
    }
    setPreviewSlug(language.slug);
    window.requestAnimationFrame(() => {
      document.getElementById(`quest-lang-${language.slug}`)?.scrollIntoView({ block: "center" });
    });
  };

  const card = (language) => (
    <LanguageCard
      key={language.id}
      id={`quest-lang-${language.slug}`}
      language={language}
      stats={progress[language.slug]}
      active={language.slug === activeSlug}
      previewOpen={previewSlug === language.slug}
      onTogglePreview={() => setPreviewSlug((current) => (current === language.slug ? "" : language.slug))}
      onOpen={onOpen}
    />
  );

  return (
    <div className="mt-4">
      {popular.length > 0 && (
        <div>
          <h3 className="font-game font-extrabold text-lg">🔥 Popular right now</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {popular.map((language) => (
              <button
                key={language.id}
                type="button"
                onClick={() => jumpTo(language)}
                className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full border-2 border-border bg-card hover:border-primary/50 hover:text-primary transition-all active:scale-[.97]"
              >
                <span aria-hidden="true">{language.icon}</span> {language.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {CATEGORY_ORDER.map((category) => {
        const group = languages.filter((language) => language.category === category.name);
        if (!group.length) return null;
        return (
          <div key={category.name} className="mt-8">
            <h3 className="flex items-center gap-2 font-game font-extrabold text-xl">
              <span className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-lg" aria-hidden="true">
                {category.icon}
              </span>
              {category.name}
              <span className="text-xs font-bold text-muted-foreground">{group.length}</span>
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">{group.map(card)}</div>
          </div>
        );
      })}
    </div>
  );
}
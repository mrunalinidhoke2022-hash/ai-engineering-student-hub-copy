import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink, BookOpen, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookmarkButton from "./BookmarkButton";

export default function ToolCard({ tool, saved, onToggle }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 hover:border-primary/40 hover:-translate-y-0.5 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-heading font-bold text-base text-foreground">{tool.name}</h3>
          <span className="text-xs font-medium text-primary">{tool.category}</span>
        </div>
        {tool.verified && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
            <CheckCircle2 className="w-3 h-3" /> Verified
          </span>
        )}
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2">{tool.description}</p>

      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{tool.level}</span>
        {(tool.tags || []).slice(0, 2).map((tag) => (
          <span key={tag} className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <a href={tool.official_url} target="_blank" rel="noreferrer" className="shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5">
            Open Website <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </a>
        <Link to={`/ai-tools/${tool.slug}`}>
          <Button size="sm" className="gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Learn How To Use
          </Button>
        </Link>
        <BookmarkButton itemType="tool" itemId={tool.id} itemName={tool.name} folder="My AI Tools" saved={saved} onToggle={onToggle} />
      </div>
    </div>
  );
}
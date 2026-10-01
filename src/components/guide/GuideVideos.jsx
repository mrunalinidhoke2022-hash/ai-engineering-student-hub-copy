import React from "react";
import { PlayCircle, ArrowUpRight } from "lucide-react";

export default function GuideVideos({ videos }) {
  return (
    <section className="bg-card border border-border rounded-lg p-6">
      <h2 className="font-heading font-bold text-lg flex items-center gap-2">
        <PlayCircle className="w-5 h-5 text-primary" /> Videos to watch
      </h2>
      <div className="mt-4 space-y-2">
        {videos.map((video) => (
          <a
            key={video.url}
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 border border-border rounded-md px-3 py-2.5 hover:border-primary/40 transition-colors"
          >
            <span className="text-sm font-medium">{video.label}</span>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </a>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3">Opens YouTube search results in a new tab.</p>
    </section>
  );
}
import React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
import { QUICK_TOPICS, findQuickTopic } from "@/data/quickTopics";
import GuideRoadmap from "@/components/guide/GuideRoadmap";
import GuideGuidance from "@/components/guide/GuideGuidance";
import GuideResources from "@/components/guide/GuideResources";
import GuideVideos from "@/components/guide/GuideVideos";

export default function TopicGuide() {
  const { slug } = useParams();
  const topic = findQuickTopic(slug);

  if (!topic) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="font-heading font-extrabold text-2xl">This guide isn't ready yet</h1>
        <p className="text-sm text-muted-foreground mt-3">
          We haven't written a quick guide for that topic so far. Try one of the guides below, or search the directory.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {QUICK_TOPICS.map((item) => (
            <Link
              key={item.slug}
              to={`/guide/${item.slug}`}
              className="text-sm font-medium px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:text-primary transition-colors"
            >
              {item.chip}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to home
      </Link>

      <header className="mt-6 bg-[#0F172A] text-white rounded-lg p-6 sm:p-8">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-400/30 rounded-full px-3 py-1">
          Quick guide
        </span>
        <h1 className="font-heading font-extrabold tracking-tight text-3xl sm:text-4xl mt-4">{topic.title}</h1>
        <p className="text-slate-300 text-sm sm:text-base mt-3">{topic.tagline}</p>
      </header>

      <section className="bg-card border border-border rounded-lg p-6 mt-6">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" /> What it is
        </h2>
        <p className="text-sm text-muted-foreground mt-3">{topic.what}</p>
      </section>

      <div className="grid gap-6 mt-6 lg:grid-cols-2">
        <div className="space-y-6">
          <GuideRoadmap steps={topic.roadmap} />
          <GuideGuidance tips={topic.guidance} />
        </div>
        <div className="space-y-6">
          <GuideResources internal={topic.internal} links={topic.links} />
          <GuideVideos videos={topic.videos} />
        </div>
      </div>

      <div className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">More quick guides</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {QUICK_TOPICS.filter((item) => item.slug !== topic.slug).map((item) => (
            <Link
              key={item.slug}
              to={`/guide/${item.slug}`}
              className="text-sm font-medium px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:text-primary transition-colors"
            >
              {item.chip}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
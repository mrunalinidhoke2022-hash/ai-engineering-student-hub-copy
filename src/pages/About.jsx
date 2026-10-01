import React from "react";
import { Link } from "react-router-dom";
import { Wrench, GraduationCap, Code2, Hammer, Trophy, MessageCircle, ArrowRight, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Wrench,
    title: "AI Tools Directory",
    text: "Every AI tool worth your time, explained in plain language with use cases, pricing and how to start.",
  },
  {
    icon: GraduationCap,
    title: "Learning Paths",
    text: "Step-by-step roadmaps for web development, AI/ML, programming basics and first-year engineering.",
  },
  {
    icon: Code2,
    title: "Coding Practice",
    text: "Practice problems with hints, full solutions and explanations — from variables to data structures.",
  },
  {
    icon: Hammer,
    title: "Project Roadmap Generator",
    text: "Type a project idea and get features, tech stack, database design, build steps and deployment notes.",
  },
  {
    icon: Trophy,
    title: "Hackathon Hub",
    text: "A complete hackathon roadmap plus ready-to-use problem statements across 13 categories.",
  },
  {
    icon: MessageCircle,
    title: "AI Engineering Mentor",
    text: "Stuck between two stacks or unsure what to build next? Ask anything and get guidance in seconds.",
  },
];

export default function About() {
  return (
    <div>
      <section className="bg-brand-navy text-white">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/30 rounded-full px-3 py-1">
            <Sparkles className="w-3.5 h-3.5" /> About Engineering Hub
          </span>
          <h1 className="font-heading font-extrabold tracking-tight text-4xl sm:text-5xl mt-5">
            One platform for every engineering student
          </h1>
          <p className="mt-6 text-slate-300 text-base sm:text-lg leading-relaxed">
            Engineering Hub is a free learning and building platform for engineering students. Instead of
            jumping between dozens of browser tabs, blogs and YouTube playlists, students use one place to
            find the right AI tool, follow a structured learning path, practise coding problems, generate a
            complete project roadmap from a single idea, and prepare for hackathons from team formation to
            final pitch. Every resource is written in beginner-friendly language, with a built-in beginner
            mode that explains technical terms, and progress is saved to a personal dashboard so students can
            pick up exactly where they left off.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14">
        <h2 className="font-heading font-extrabold text-2xl sm:text-3xl">What you'll find here</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="bg-card border border-border rounded-lg p-5">
              <feature.icon className="w-5 h-5 text-primary" />
              <h3 className="font-heading font-bold text-base mt-3">{feature.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-16 grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-heading font-bold text-xl flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Who it's for
          </h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            Engineering Hub is built for students who want to build things but don't know where to start.
            That includes first-year students meeting programming for the first time, second and third-year
            students choosing a specialisation, self-taught learners without a mentor on campus, and student
            hackathon teams that need problem statements, a realistic build plan and a demo they can present
            with confidence. Teachers, clubs and study groups use it as a shared reference for workshops too.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-heading font-bold text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Who builds it
          </h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            Engineering Hub is designed, built and maintained by <strong>MrunalTech</strong>, a student team
            founded by <strong>Mrunalini Pramod Dhoke</strong> (CEO &amp; Co-Founder) and{" "}
            <strong>Sanchita Bhaskar Chimate</strong> (Co-Founder). The platform started as a DevLaunch /
            TechNova'26 project and is still shaped by student feedback — new tools, learning paths and
            problem statements are added continuously. Found a mistake, want a tool added, or want to
            contribute content? The team reads every message.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link to="/team">
              <Button variant="outline" size="sm" className="gap-1.5">
                Meet the founders <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="sm" className="gap-1.5">
                Contact us <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
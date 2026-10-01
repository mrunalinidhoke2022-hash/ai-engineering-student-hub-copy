import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, Bug, Lightbulb, Trophy, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTACT_EMAIL } from "@/components/layout/SiteFooter";

const REASONS = [
  { icon: Bug, text: "Report a broken page, wrong link or a tool that no longer works." },
  { icon: Lightbulb, text: "Suggest an AI tool, learning path or coding problem we should add." },
  { icon: Trophy, text: "Ask about hackathon preparation, problem statements or project ideas." },
  { icon: Users, text: "Invite your college club to use Engineering Hub for a workshop." },
];

export default function Contact() {
  return (
    <div>
      <section className="bg-brand-navy text-white">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/30 rounded-full px-3 py-1">
            <Mail className="w-3.5 h-3.5" /> Contact
          </span>
          <h1 className="font-heading font-extrabold tracking-tight text-4xl sm:text-5xl mt-5">
            Talk to the Engineering Hub team
          </h1>
          <p className="mt-5 text-slate-300 text-base sm:text-lg">
            Questions, feedback and content suggestions are always welcome. Reach the MrunalTech team
            directly using the details below — we usually reply within 1–2 days.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-5 sm:px-8 py-14">
        <div className="grid sm:grid-cols-2 gap-5">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="bg-card border border-border rounded-lg p-6 hover:border-primary/40 transition-colors"
          >
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-bold text-base mt-3">Email us</h2>
            <p className="text-sm text-primary mt-1 break-all">{CONTACT_EMAIL}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Best for detailed feedback, bug reports and partnership requests.
            </p>
          </a>

          <a
            href="tel:8788185009"
            className="bg-card border border-border rounded-lg p-6 hover:border-primary/40 transition-colors"
          >
            <Phone className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-bold text-base mt-3">Call us</h2>
            <p className="text-sm text-primary mt-1">8788185009</p>
            <p className="text-xs text-muted-foreground mt-2">
              Monday to Saturday, 10:00 – 19:00 IST.
            </p>
          </a>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 mt-6">
          <h2 className="font-heading font-bold text-lg">What you can write to us about</h2>
          <ul className="mt-4 space-y-3">
            {REASONS.map((reason) => (
              <li key={reason.text} className="flex items-start gap-3">
                <reason.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">{reason.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-3 mt-8">
          <Link to="/team">
            <Button variant="outline" size="sm" className="gap-1.5">
              Meet the founders <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/about">
            <Button variant="ghost" size="sm" className="gap-1.5">
              Learn about the platform <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
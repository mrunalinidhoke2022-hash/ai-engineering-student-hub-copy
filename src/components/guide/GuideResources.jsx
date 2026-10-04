import React from "react";
import { Link } from "react-router-dom";
import { Globe, Sparkles } from "lucide-react";

export default function GuideResources({ internal, links }) {
  return (
    <section className="bg-card border border-border rounded-lg p-6">
      <h2 className="font-heading font-bold text-lg flex items-center gap-2">
        <Globe className="w-5 h-5 text-primary" /> Websites and resources
      </h2>

      {internal.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Inside DEVLAUNCH</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {internal.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:text-primary transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" /> {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-border rounded-md p-3 hover:border-primary/40 transition-colors"
          >
            <p className="font-semibold text-sm text-primary">{link.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{link.note}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
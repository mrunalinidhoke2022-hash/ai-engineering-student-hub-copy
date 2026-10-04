import React from "react";
import { Link } from "react-router-dom";
import PageMeta from "@/components/common/PageMeta";

export default function LegalPage({ title, updated, intro, sections, metaDescription }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <PageMeta title={`${title} | DEVLAUNCH`} description={metaDescription || intro} />
      <h1 className="font-heading font-extrabold text-3xl">{title}</h1>
      <p className="text-xs text-muted-foreground mt-2">Last updated {updated}</p>
      <p className="text-sm text-muted-foreground mt-5 leading-relaxed">{intro}</p>

      <div className="mt-8 space-y-7">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-heading font-bold text-lg">{section.heading}</h2>
            {(section.body || []).map((paragraph) => (
              <p key={paragraph} className="text-sm text-muted-foreground mt-2 leading-relaxed">{paragraph}</p>
            ))}
            {section.bullets ? (
              <ul className="mt-2 space-y-1.5 list-disc pl-5 text-sm text-muted-foreground">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        Questions about this page? <Link to="/contact" className="font-semibold text-primary">Contact the DEVLAUNCH team</Link>.
      </p>
    </div>
  );
}
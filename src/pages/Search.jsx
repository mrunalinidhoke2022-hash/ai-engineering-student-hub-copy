import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import EmptyState from "@/components/common/EmptyState";
import { base44 } from "@/api/base44Client";

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (!q.trim()) return;
    const regex = { $regex: q.trim(), $options: "i" };
    Promise.all([
      base44.entities.Tool.filter({ name: regex }, { limit: 8 }),
      base44.entities.LearningPath.filter({ title: regex }, { limit: 6 }),
      base44.entities.CodingProblem.filter({ title: regex }, { limit: 6 }),
      base44.entities.Prompt.filter({ title: regex }, { limit: 6 }),
      base44.entities.ProblemStatement.filter({ title: regex }, { limit: 6 }),
    ]).then(([tools, paths, problems, prompts, statements]) => {
      setResults({ tools: tools.items, paths: paths.items, problems: problems.items, prompts: prompts.items, statements: statements.items });
    });
  }, [q]);

  const total = results ? Object.values(results).reduce((a, b) => a + b.length, 0) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-heading font-extrabold text-2xl">Search results for "{q}"</h1>

      {!results ? (
        <p className="text-sm text-muted-foreground mt-6">Searching...</p>
      ) : total === 0 ? (
        <EmptyState title="We couldn't find anything matching your search" description="Try another keyword or explore a category from the navigation." />
      ) : (
        <div className="mt-8 space-y-8">
          {results.tools.length > 0 && (
            <section>
              <h2 className="font-heading font-bold text-lg mb-2">AI Tools</h2>
              <div className="space-y-2">
                {results.tools.map((t) => (
                  <Link key={t.id} to={`/ai-tools/${t.slug}`} className="block border border-border rounded-md p-3 hover:border-primary/40 bg-card">
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {results.paths.length > 0 && (
            <section>
              <h2 className="font-heading font-bold text-lg mb-2">Learning Paths</h2>
              <div className="space-y-2">
                {results.paths.map((p) => (
                  <Link key={p.id} to="/learn" className="block border border-border rounded-md p-3 hover:border-primary/40 bg-card">
                    <p className="font-semibold text-sm">{p.title}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {results.problems.length > 0 && (
            <section>
              <h2 className="font-heading font-bold text-lg mb-2">Coding Problems</h2>
              <div className="space-y-2">
                {results.problems.map((p) => (
                  <Link key={p.id} to={`/coding-practice/${p.id}`} className="block border border-border rounded-md p-3 hover:border-primary/40 bg-card">
                    <p className="font-semibold text-sm">{p.title}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {results.prompts.length > 0 && (
            <section>
              <h2 className="font-heading font-bold text-lg mb-2">Prompts</h2>
              <div className="space-y-2">
                {results.prompts.map((p) => (
                  <Link key={p.id} to="/prompts" className="block border border-border rounded-md p-3 hover:border-primary/40 bg-card">
                    <p className="font-semibold text-sm">{p.title}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {results.statements.length > 0 && (
            <section>
              <h2 className="font-heading font-bold text-lg mb-2">Hackathon Problem Statements</h2>
              <div className="space-y-2">
                {results.statements.map((p) => (
                  <Link key={p.id} to="/hackathon-hub" className="block border border-border rounded-md p-3 hover:border-primary/40 bg-card">
                    <p className="font-semibold text-sm">{p.title}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
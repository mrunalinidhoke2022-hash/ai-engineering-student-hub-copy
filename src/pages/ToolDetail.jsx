import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ExternalLink, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookmarkButton from "@/components/tools/BookmarkButton";
import ToolVerificationNote from "@/components/tools/ToolVerificationNote";
import ReportToolDialog from "@/components/tools/ReportToolDialog";
import EmptyState from "@/components/common/EmptyState";
import { base44 } from "@/api/base44Client";

function Section({ title, children }) {
  if (!children) return null;
  return (
    <div className="border-t border-border pt-6 mt-6 first:border-t-0 first:pt-0 first:mt-0">
      <h2 className="font-heading font-bold text-lg mb-2">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{children}</div>
    </div>
  );
}

export default function ToolDetail() {
  const { slug } = useParams();
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    base44.entities.Tool.filter({ slug }, { limit: 1 })
      .then((page) => setTool(page.items[0] || null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-16 text-sm text-muted-foreground">Loading tool...</div>;
  if (!tool) return <EmptyState title="Tool not found" description="This tool may have been removed. Browse the AI Tools directory instead." />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/ai-tools" className="text-sm font-semibold text-primary">← Back to AI Tools</Link>

      <div className="mt-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading font-extrabold text-3xl">{tool.name}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent text-primary">{tool.category}</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">{tool.level}</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">{tool.pricing}</span>
            {tool.verified && (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified {tool.last_verified ? `· ${tool.last_verified}` : ""}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <a href={tool.official_url} target="_blank" rel="noreferrer">
            <Button className="gap-1.5">Official Website <ExternalLink className="w-3.5 h-3.5" /></Button>
          </a>
          <BookmarkButton itemType="tool" itemId={tool.id} itemName={tool.name} />
          <ReportToolDialog tool={tool} />
        </div>
      </div>

      <p className="text-muted-foreground mt-4">{tool.description}</p>

      <div className="mt-4">
        <ToolVerificationNote tool={tool} />
      </div>

      <div className="bg-card border border-border rounded-lg p-6 mt-6">
        <Section title="What is this tool?">{tool.what_is}</Section>
        <Section title="Why should students use it?">{tool.why_use}</Section>
        <Section title="What can I do with it?">{tool.what_can_you_do}</Section>
        <Section title="How to start">{tool.how_to_start}</Section>
        <Section title="Beginner Tutorial">{tool.tutorial}</Section>
        {tool.example_prompts?.length > 0 && (
          <Section title="Example Prompts">
            <ul className="space-y-2">
              {tool.example_prompts.map((p, i) => (
                <li key={i} className="font-mono text-xs bg-secondary rounded-md p-2.5">{p}</li>
              ))}
            </ul>
          </Section>
        )}
        <Section title="Prompt Formula">
          {tool.prompt_formula_example || "ROLE + TASK + CONTEXT + REQUIREMENTS + OUTPUT FORMAT"}
        </Section>
        <Section title="Common Mistakes">{tool.common_mistakes}</Section>
        <Section title="Practice Challenge">{tool.practice_challenge}</Section>
        <Section title="Advanced Features">{tool.advanced_features}</Section>
        {tool.related_tools?.length > 0 && (
          <Section title="Related Tools">
            <div className="flex flex-wrap gap-2">
              {tool.related_tools.map((r) => (
                <span key={r} className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary">{r}</span>
              ))}
            </div>
          </Section>
        )}
        <Section title="Documentation">
          {tool.docs_url ? (
            <a href={tool.docs_url} target="_blank" rel="noreferrer" className="text-primary font-semibold inline-flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> View official documentation
            </a>
          ) : (
            "No official documentation link available yet."
          )}
        </Section>
      </div>
    </div>
  );
}
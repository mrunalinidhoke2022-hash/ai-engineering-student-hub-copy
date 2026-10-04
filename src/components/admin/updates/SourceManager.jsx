import React, { useState } from "react";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import EmptyState from "@/components/common/EmptyState";
import { relativeLabel } from "./labels";

const CATEGORIES = [
  "ai_tools",
  "developer_tools",
  "coding_platforms",
  "learning_resources",
  "engineering_technology",
  "hackathons",
  "competitions",
  "announcements",
  "tutorials",
];

const EMPTY = { name: "", url: "", category: "ai_tools", kind: "rss", notes: "" };

// The approved source list. Only feeds an admin saved here are ever fetched, one request per source
// per run, and every failure is recorded on the row instead of being swallowed.
export default function SourceManager({ sources, onChanged }) {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();

  const save = async () => {
    if (!form?.name?.trim() || !form?.url?.trim()) {
      setError(t("adminUpdates.source.required"));
      return;
    }
    if (!/^https?:\/\/[^\s]+\.[^\s]+/i.test(form.url.trim())) {
      setError(t("adminUpdates.source.invalidUrl"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim().slice(0, 120),
        url: form.url.trim().slice(0, 400),
        category: form.category,
        kind: form.kind,
        notes: (form.notes || "").slice(0, 400),
        enabled: form.enabled !== false,
      };
      if (form.id) await base44.entities.ContentSource.update(form.id, payload);
      else await base44.entities.ContentSource.create(payload);
      setForm(null);
      toast({ description: t("adminUpdates.source.saved") });
      onChanged?.();
    } catch {
      setError(t("errors.generic"));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (source) => {
    await base44.entities.ContentSource.update(source.id, { enabled: source.enabled === false });
    onChanged?.();
  };

  const remove = async (id) => {
    await base44.entities.ContentSource.delete(id);
    setConfirmId("");
    onChanged?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-heading font-bold text-sm">{t("adminUpdates.tab.sources")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("adminUpdates.source.hint")}</p>
        </div>
        <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setForm({ ...EMPTY })}>
          <Plus className="w-4 h-4" /> {t("adminUpdates.source.add")}
        </Button>
      </div>

      {form ? (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div>
            <Label htmlFor="source-name">{t("adminUpdates.source.name")}</Label>
            <Input id="source-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="source-url">{t("adminUpdates.source.url")}</Label>
            <Input id="source-url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="mt-1" placeholder="https://example.com/feed.xml" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="source-cat">{t("adminUpdates.source.category")}</Label>
              <select
                id="source-cat"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {t(`adminUpdates.cat.${category}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="source-kind">{t("adminUpdates.source.format")}</Label>
              <select
                id="source-kind"
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
                className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="rss">{t("adminUpdates.source.kind.rss")}</option>
                <option value="api">{t("adminUpdates.source.kind.api")}</option>
              </select>
            </div>
          </div>
          {error ? <p className="text-xs font-medium text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p> : null}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 min-h-[44px]" onClick={() => setForm(null)} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button className="flex-1 min-h-[44px]" onClick={save} disabled={busy}>
              {busy ? t("common.saving") : t("adminUpdates.source.save")}
            </Button>
          </div>
        </div>
      ) : null}

      {!sources.length ? (
        <EmptyState title={t("adminUpdates.emptySources")} description={t("adminUpdates.emptySourcesDesc")} />
      ) : (
        <div className="bg-card border border-border rounded-lg divide-y divide-border overflow-hidden">
          {sources.map((source) => (
            <div key={source.id} className="p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold break-words">{source.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {t(`adminUpdates.cat.${source.category}`)} · {t(`adminUpdates.source.kind.${source.kind || "rss"}`)} ·{" "}
                    {t("adminUpdates.source.lastChecked")} {relativeLabel(t, source.last_fetched_at)}
                  </p>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[11px] text-primary inline-flex items-center gap-1 mt-0.5 break-all"
                  >
                    {source.url} <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                  {source.last_status === "error" && source.last_error ? (
                    <p className="text-[11px] text-warning mt-1">{source.last_error}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggle(source)}
                    className={`min-h-[36px] text-[11px] font-semibold px-2.5 rounded-full border ${
                      source.enabled === false ? "border-border text-muted-foreground" : "border-success/40 text-success bg-success/10"
                    }`}
                  >
                    {source.enabled === false ? t("adminUpdates.source.disabled") : t("adminUpdates.source.enabled")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...EMPTY, ...source })}
                    className="p-2 text-muted-foreground hover:text-primary"
                    aria-label={t("adminUpdates.source.edit")}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(source.id)}
                    className="p-2 text-muted-foreground hover:text-destructive"
                    aria-label={t("adminUpdates.source.remove")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {confirmId === source.id ? (
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-xs text-muted-foreground flex-1">{t("adminUpdates.source.confirm")}</p>
                  <button type="button" onClick={() => setConfirmId("")} className="text-xs font-semibold px-2 py-1">
                    {t("common.cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(source.id)}
                    className="text-xs font-semibold text-destructive px-2 py-1"
                  >
                    {t("adminUpdates.source.remove")}
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
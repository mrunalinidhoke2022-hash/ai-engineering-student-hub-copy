import React, { useState } from "react";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import IdentityPanel from "@/components/profile/IdentityPanel";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "Final Year", "Graduate"];

export default function Profile() {
  const { user, checkUserAuth } = useAuth();
  const { t, term, language, setLanguage, languages } = useLanguage();
  const [form, setForm] = useState({
    year: user?.year || "",
    branch: user?.branch || "",
    skills: (user?.skills || []).join(", "),
    interests: (user?.interests || []).join(", "),
    learning_goals: (user?.learning_goals || []).join(", "),
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const save = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        year: form.year,
        branch: form.branch,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        interests: form.interests.split(",").map((s) => s.trim()).filter(Boolean),
        learning_goals: form.learning_goals.split(",").map((s) => s.trim()).filter(Boolean),
      });
      await checkUserAuth();
      toast({ description: t("profile.updated") });
    } finally {
      setSaving(false);
    }
  };

  const chooseLanguage = (code) => {
    setLanguage(code);
    toast({ description: t("language.saved") });
  };

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-heading font-extrabold text-3xl">{t("profile.title")}</h1>
      <p className="text-muted-foreground mt-1">{t("profile.subtitle")}</p>

      <div className="mt-6">
        <IdentityPanel />
      </div>

      <div className="bg-card border border-border rounded-lg p-6 mt-6">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2">
          <Languages className="w-4 h-4 text-primary" /> {t("profile.language")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("profile.languageDesc")}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {languages.map((item) => (
            <button
              key={item.code}
              onClick={() => chooseLanguage(item.code)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                item.code === language
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {item.native}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 mt-6 space-y-4">
        <h2 className="font-heading font-bold text-lg">{t("profile.learningProfile")}</h2>
        <div>
          <Label>{t("profile.year")}</Label>
          <Select value={form.year} onValueChange={(v) => setForm({ ...form, year: v })}>
            <SelectTrigger className="mt-1"><SelectValue placeholder={t("profile.selectYear")} /></SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => <SelectItem key={y} value={y}>{term(y)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t("profile.branch")}</Label>
          <Input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} placeholder={t("profile.branchPlaceholder")} className="mt-1" />
        </div>
        <div>
          <Label>{t("profile.skills")}</Label>
          <Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder={t("profile.skillsPlaceholder")} className="mt-1" />
        </div>
        <div>
          <Label>{t("profile.interests")}</Label>
          <Input value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} placeholder={t("profile.interestsPlaceholder")} className="mt-1" />
        </div>
        <div>
          <Label>{t("profile.goals")}</Label>
          <Input value={form.learning_goals} onChange={(e) => setForm({ ...form, learning_goals: e.target.value })} placeholder={t("profile.goalsPlaceholder")} className="mt-1" />
        </div>
        <Button onClick={save} disabled={saving} className="w-full">{saving ? t("common.saving") : t("profile.save")}</Button>
      </div>
    </div>
  );
}
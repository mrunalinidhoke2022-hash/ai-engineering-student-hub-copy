import React, { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { CHALLENGE_TYPE_LABELS, DIFFICULTY_OPTIONS, TIERS, TYPE_OPTIONS } from "@/components/quest/questLabels";
import {
  EMPTY_CHALLENGE, EMPTY_LESSON, EMPTY_SOLUTION, STANDARD_TRACK, commaToTopics, listToText,
  textToList, textToTests, topicsToComma, testsToText,
} from "./questForms";

const SELECT_CLASS = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const TABS = [
  ["languages", "Languages"],
  ["lessons", "Lessons"],
  ["challenges", "Challenges"],
];

export default function QuestContentManager() {
  const { toast } = useToast();
  const [tab, setTab] = useState("languages");
  const [languages, setLanguages] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [filterSlug, setFilterSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [languageDraft, setLanguageDraft] = useState(null);
  const [lessonDraft, setLessonDraft] = useState(null);
  const [challengeDraft, setChallengeDraft] = useState(null);
  const [solutionDraft, setSolutionDraft] = useState(EMPTY_SOLUTION);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [hintText, setHintText] = useState("");
  const [optionText, setOptionText] = useState("");
  const [testText, setTestText] = useState("");
  const [acceptedText, setAcceptedText] = useState("");

  const loadLanguages = () =>
    base44.entities.ProgrammingLanguage.list({ sort: "sort_order", limit: 100 }).then((page) => setLanguages(page.items || []));

  const loadContent = (slug) => {
    const query = slug ? { language_slug: slug } : {};
    return Promise.all([
      base44.entities.Lesson.filter(query, { sort: "order", limit: 200 }),
      base44.entities.CodingChallenge.filter(query, { limit: 200 }),
    ]).then(([lessonPage, challengePage]) => {
      setLessons(lessonPage.items || []);
      setChallenges(challengePage.items || []);
    });
  };

  useEffect(() => {
    Promise.all([loadLanguages(), loadContent("")]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadContent(filterSlug);
  }, [filterSlug]);

  const call = async (payload, message) => {
    setSaving(true);
    try {
      await base44.functions.invoke("questAdmin", payload);
      toast({ description: message });
      return true;
    } catch (error) {
      toast({ description: error?.response?.data?.error || "That could not be saved", variant: "destructive" });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const refresh = async () => {
    await Promise.all([loadLanguages(), loadContent(filterSlug)]);
  };

  const saveLanguage = async () => {
    if (!languageDraft.name.trim()) {
      toast({ description: "A language name is required", variant: "destructive" });
      return;
    }
    const ok = await call(
      { action: "language.save", language: { ...languageDraft, slug: languageDraft.slug || languageDraft.name } },
      "Language saved"
    );
    if (ok) {
      setLanguageDraft(null);
      refresh();
    }
  };

  const saveLesson = async () => {
    if (!lessonDraft.title.trim() || !lessonDraft.language_slug) {
      toast({ description: "Pick a language and give the lesson a title", variant: "destructive" });
      return;
    }
    const ok = await call({ action: "lesson.save", lesson: lessonDraft }, "Lesson saved");
    if (ok) {
      setLessonDraft(null);
      refresh();
    }
  };

  const saveChallenge = async () => {
    if (!challengeDraft.title.trim() || !challengeDraft.problem.trim() || !challengeDraft.language_slug) {
      toast({ description: "Pick a language, then add a title and problem statement", variant: "destructive" });
      return;
    }
    const ok = await call(
      { action: "challenge.save", challenge: challengeDraft, solution: solutionDraft },
      "Challenge saved"
    );
    if (ok) {
      setChallengeDraft(null);
      refresh();
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const actions = { language: "language.delete", lesson: "lesson.delete", challenge: "challenge.delete" };
    const ok = await call({ action: actions[deleteTarget.kind], id: deleteTarget.id }, "Removed");
    if (ok) {
      setDeleteTarget(null);
      refresh();
    }
  };

  const openChallenge = async (challenge) => {
    const solutionPage = await base44.entities.ChallengeSolution.filter({ challenge_id: challenge.id }, { limit: 1 });
    const solution = solutionPage.items?.[0] || null;
    setSolutionDraft({ ...EMPTY_SOLUTION, ...(solution || {}) });
    setChallengeDraft(challenge);
    setHintText(listToText(challenge.hints));
    setOptionText(listToText(challenge.options));
    setTestText(testsToText(challenge.test_cases));
    setAcceptedText(listToText(solution?.accepted_answers));
  };

  const updateLevel = (index, patch) =>
    setLanguageDraft((draft) => ({ ...draft, levels: draft.levels.map((level, i) => (i === index ? { ...level, ...patch } : level)) }));

  if (loading) {
    return <p className="text-sm text-muted-foreground mt-8">Loading CodeQuest content...</p>;
  }

  return (
    <div className="mt-10">
      <h2 className="font-heading font-bold text-lg">CodeQuest</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Languages, level roadmaps, learning-mode lessons and practice challenges. Students only ever see what you publish here.
      </p>

      <div className="flex gap-2 mt-4 flex-wrap">
        {TABS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
              tab === value ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
        {languages.length > 0 && (
          <select value={filterSlug} onChange={(event) => setFilterSlug(event.target.value)} className={`${SELECT_CLASS} sm:w-56`}>
            <option value="">All languages</option>
            {languages.map((language) => (
              <option key={language.id} value={language.slug}>{language.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 mb-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {tab === "languages" ? `${languages.length} languages` : tab === "lessons" ? `${lessons.length} lessons` : `${challenges.length} challenges`}
        </p>
        <Button
          size="sm"
          className="gap-1.5"
          disabled={saving}
          onClick={() => {
            if (tab === "languages") setLanguageDraft({ ...EMPTY_TRACK_LANGUAGE() });
            if (tab === "lessons") setLessonDraft({ ...EMPTY_LESSON, language_slug: filterSlug || languages[0]?.slug || "" });
            if (tab === "challenges") {
              setSolutionDraft({ ...EMPTY_SOLUTION });
              setHintText("");
              setOptionText("");
              setTestText("");
              setAcceptedText("");
              setChallengeDraft({ ...EMPTY_CHALLENGE, language_slug: filterSlug || languages[0]?.slug || "" });
            }
          }}
        >
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>

      <div className="border border-border rounded-lg divide-y divide-border overflow-hidden bg-card">
        {tab === "languages" &&
          languages.map((language) => (
            <div key={language.id} className="flex items-center justify-between gap-3 p-3.5">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{language.name}</p>
                <p className="text-xs text-muted-foreground">
                  {language.slug} · {language.levels?.length || 0} levels · {language.enabled === false ? "hidden" : "published"}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setLanguageDraft(language)} className="p-2 text-muted-foreground hover:text-primary">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteTarget({ kind: "language", id: language.id, label: language.name })} className="p-2 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

        {tab === "lessons" &&
          lessons.map((lesson) => (
            <div key={lesson.id} className="flex items-center justify-between gap-3 p-3.5">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{lesson.title}</p>
                <p className="text-xs text-muted-foreground">
                  {lesson.language_slug} · level {lesson.level_order} · +{lesson.xp_reward ?? 20} XP · {lesson.published === false ? "draft" : "published"}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setLessonDraft(lesson)} className="p-2 text-muted-foreground hover:text-primary">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteTarget({ kind: "lesson", id: lesson.id, label: lesson.title })} className="p-2 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

        {tab === "challenges" &&
          challenges.map((challenge) => (
            <div key={challenge.id} className="flex items-center justify-between gap-3 p-3.5">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{challenge.title}</p>
                <p className="text-xs text-muted-foreground">
                  {challenge.language_slug} · level {challenge.level_order} · {CHALLENGE_TYPE_LABELS[challenge.type] || challenge.type} · {challenge.difficulty} · +{challenge.xp_reward ?? 30} XP
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openChallenge(challenge)} className="p-2 text-muted-foreground hover:text-primary">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteTarget({ kind: "challenge", id: challenge.id, label: challenge.title })} className="p-2 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

        {((tab === "languages" && languages.length === 0) ||
          (tab === "lessons" && lessons.length === 0) ||
          (tab === "challenges" && challenges.length === 0)) && (
          <p className="p-4 text-sm text-muted-foreground">Nothing here yet — use Add to create the first entry.</p>
        )}
      </div>

      <Dialog open={!!languageDraft} onOpenChange={(open) => !open && setLanguageDraft(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{languageDraft?.id ? "Edit language" : "Add language"}</DialogTitle></DialogHeader>
          {languageDraft && (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Name</Label><Input value={languageDraft.name} onChange={(e) => setLanguageDraft({ ...languageDraft, name: e.target.value })} className="mt-1" /></div>
                <div><Label>Slug</Label><Input value={languageDraft.slug} onChange={(e) => setLanguageDraft({ ...languageDraft, slug: e.target.value })} placeholder="python" className="mt-1" /></div>
              </div>
              <div><Label>Tagline</Label><Input value={languageDraft.tagline || ""} onChange={(e) => setLanguageDraft({ ...languageDraft, tagline: e.target.value })} className="mt-1" /></div>
              <div><Label>What is it</Label><Textarea value={languageDraft.overview || ""} onChange={(e) => setLanguageDraft({ ...languageDraft, overview: e.target.value })} rows={3} className="mt-1" /></div>
              <div><Label>Where it is used</Label><Textarea value={languageDraft.where_used || ""} onChange={(e) => setLanguageDraft({ ...languageDraft, where_used: e.target.value })} rows={2} className="mt-1" /></div>
              <div><Label>Installation &amp; setup</Label><Textarea value={languageDraft.setup_guide || ""} onChange={(e) => setLanguageDraft({ ...languageDraft, setup_guide: e.target.value })} rows={3} className="mt-1" /></div>

              <div className="flex items-center gap-2 flex-wrap border-t border-border pt-3">
                <p className="text-sm font-semibold">Level roadmap</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setLanguageDraft({ ...languageDraft, levels: STANDARD_TRACK.map((level) => ({ ...level, topics: [...level.topics] })) })}
                >
                  <Wand2 className="w-4 h-4" /> Use standard track
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setLanguageDraft({
                      ...languageDraft,
                      levels: [...(languageDraft.levels || []), { order: (languageDraft.levels?.length || 0) + 1, title: "", tier: "Beginner", focus: "", topics: [] }],
                    })
                  }
                >
                  <Plus className="w-4 h-4" /> Add level
                </Button>
              </div>

              <div className="space-y-3">
                {(languageDraft.levels || []).map((level, index) => (
                  <div key={index} className="border border-border rounded-md p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold">Level {index + 1}</p>
                      <button
                        onClick={() => setLanguageDraft({ ...languageDraft, levels: languageDraft.levels.filter((_, i) => i !== index) })}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <Input value={level.title} onChange={(e) => updateLevel(index, { title: e.target.value })} placeholder="Level title" />
                    <select value={level.tier} onChange={(e) => updateLevel(index, { tier: e.target.value })} className={SELECT_CLASS}>
                      {TIERS.map((tier) => (<option key={tier} value={tier}>{tier}</option>))}
                    </select>
                    <Input value={level.focus || ""} onChange={(e) => updateLevel(index, { focus: e.target.value })} placeholder="What this level covers" />
                    <Input value={topicsToComma(level.topics)} onChange={(e) => updateLevel(index, { topics: commaToTopics(e.target.value) })} placeholder="Topics, separated by commas" />
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={languageDraft.enabled !== false} onChange={(e) => setLanguageDraft({ ...languageDraft, enabled: e.target.checked })} />
                Visible to students
              </label>

              <Button onClick={saveLanguage} disabled={saving} className="w-full gap-1.5">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save language
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!lessonDraft} onOpenChange={(open) => !open && setLessonDraft(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{lessonDraft?.id ? "Edit lesson" : "Add lesson"}</DialogTitle></DialogHeader>
          {lessonDraft && (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Language</Label>
                  <select value={lessonDraft.language_slug} onChange={(e) => setLessonDraft({ ...lessonDraft, language_slug: e.target.value })} className={`${SELECT_CLASS} mt-1`}>
                    <option value="">Select a language</option>
                    {languages.map((language) => (<option key={language.id} value={language.slug}>{language.name}</option>))}
                  </select>
                </div>
                <div><Label>Level number</Label><Input type="number" min="1" value={lessonDraft.level_order} onChange={(e) => setLessonDraft({ ...lessonDraft, level_order: Number(e.target.value) })} className="mt-1" /></div>
              </div>
              <div><Label>Title</Label><Input value={lessonDraft.title} onChange={(e) => setLessonDraft({ ...lessonDraft, title: e.target.value })} className="mt-1" /></div>
              <div><Label>One-line summary</Label><Input value={lessonDraft.summary || ""} onChange={(e) => setLessonDraft({ ...lessonDraft, summary: e.target.value })} className="mt-1" /></div>
              <div><Label>Simple explanation</Label><Textarea value={lessonDraft.explanation || ""} onChange={(e) => setLessonDraft({ ...lessonDraft, explanation: e.target.value })} rows={3} className="mt-1" /></div>
              <div><Label>Real-world example</Label><Textarea value={lessonDraft.real_world_example || ""} onChange={(e) => setLessonDraft({ ...lessonDraft, real_world_example: e.target.value })} rows={2} className="mt-1" /></div>
              <div><Label>Code example</Label><Textarea value={lessonDraft.code_example || ""} onChange={(e) => setLessonDraft({ ...lessonDraft, code_example: e.target.value })} rows={4} className="mt-1 font-mono text-xs" /></div>
              <div><Label>Try it yourself</Label><Textarea value={lessonDraft.try_it || ""} onChange={(e) => setLessonDraft({ ...lessonDraft, try_it: e.target.value })} rows={2} className="mt-1" /></div>
              <div><Label>Practice question</Label><Textarea value={lessonDraft.practice_question || ""} onChange={(e) => setLessonDraft({ ...lessonDraft, practice_question: e.target.value })} rows={2} className="mt-1" /></div>
              <div><Label>Common mistake</Label><Textarea value={lessonDraft.common_mistake || ""} onChange={(e) => setLessonDraft({ ...lessonDraft, common_mistake: e.target.value })} rows={2} className="mt-1" /></div>
              <div><Label>Hint</Label><Textarea value={lessonDraft.hint || ""} onChange={(e) => setLessonDraft({ ...lessonDraft, hint: e.target.value })} rows={2} className="mt-1" /></div>
              <div><Label>Solution explanation</Label><Textarea value={lessonDraft.solution_explanation || ""} onChange={(e) => setLessonDraft({ ...lessonDraft, solution_explanation: e.target.value })} rows={2} className="mt-1" /></div>
              <div><Label>Mini challenge</Label><Textarea value={lessonDraft.mini_challenge || ""} onChange={(e) => setLessonDraft({ ...lessonDraft, mini_challenge: e.target.value })} rows={2} className="mt-1" /></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>XP reward</Label><Input type="number" min="5" value={lessonDraft.xp_reward ?? 20} onChange={(e) => setLessonDraft({ ...lessonDraft, xp_reward: Number(e.target.value) })} className="mt-1" /></div>
                <label className="flex items-center gap-2 text-sm mt-6">
                  <input type="checkbox" checked={lessonDraft.published !== false} onChange={(e) => setLessonDraft({ ...lessonDraft, published: e.target.checked })} />
                  Published
                </label>
              </div>
              <Button onClick={saveLesson} disabled={saving} className="w-full gap-1.5">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save lesson
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!challengeDraft} onOpenChange={(open) => !open && setChallengeDraft(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{challengeDraft?.id ? "Edit challenge" : "Add challenge"}</DialogTitle></DialogHeader>
          {challengeDraft && (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Language</Label>
                  <select value={challengeDraft.language_slug} onChange={(e) => setChallengeDraft({ ...challengeDraft, language_slug: e.target.value })} className={`${SELECT_CLASS} mt-1`}>
                    <option value="">Select a language</option>
                    {languages.map((language) => (<option key={language.id} value={language.slug}>{language.name}</option>))}
                  </select>
                </div>
                <div><Label>Level number</Label><Input type="number" min="1" value={challengeDraft.level_order} onChange={(e) => setChallengeDraft({ ...challengeDraft, level_order: Number(e.target.value) })} className="mt-1" /></div>
              </div>
              <div><Label>Title</Label><Input value={challengeDraft.title} onChange={(e) => setChallengeDraft({ ...challengeDraft, title: e.target.value })} className="mt-1" /></div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label>Type</Label>
                  <select value={challengeDraft.type} onChange={(e) => setChallengeDraft({ ...challengeDraft, type: e.target.value })} className={`${SELECT_CLASS} mt-1`}>
                    {TYPE_OPTIONS.map((type) => (<option key={type} value={type}>{CHALLENGE_TYPE_LABELS[type]}</option>))}
                  </select>
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <select value={challengeDraft.difficulty} onChange={(e) => setChallengeDraft({ ...challengeDraft, difficulty: e.target.value })} className={`${SELECT_CLASS} mt-1`}>
                    {DIFFICULTY_OPTIONS.map((value) => (<option key={value} value={value}>{value}</option>))}
                  </select>
                </div>
                <div><Label>Topic</Label><Input value={challengeDraft.topic || ""} onChange={(e) => setChallengeDraft({ ...challengeDraft, topic: e.target.value })} placeholder="Loops" className="mt-1" /></div>
              </div>
              <div><Label>Problem statement</Label><Textarea value={challengeDraft.problem} onChange={(e) => setChallengeDraft({ ...challengeDraft, problem: e.target.value })} rows={4} className="mt-1" /></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Expected input</Label><Textarea value={challengeDraft.expected_input || ""} onChange={(e) => setChallengeDraft({ ...challengeDraft, expected_input: e.target.value })} rows={2} className="mt-1 font-mono text-xs" /></div>
                <div><Label>Expected output</Label><Textarea value={challengeDraft.expected_output || ""} onChange={(e) => setChallengeDraft({ ...challengeDraft, expected_output: e.target.value })} rows={2} className="mt-1 font-mono text-xs" /></div>
              </div>
              <div><Label>Constraints</Label><Input value={challengeDraft.constraints || ""} onChange={(e) => setChallengeDraft({ ...challengeDraft, constraints: e.target.value })} className="mt-1" /></div>
              <div><Label>Example</Label><Textarea value={challengeDraft.example || ""} onChange={(e) => setChallengeDraft({ ...challengeDraft, example: e.target.value })} rows={2} className="mt-1" /></div>
              <div><Label>Starter code</Label><Textarea value={challengeDraft.starter_code || ""} onChange={(e) => setChallengeDraft({ ...challengeDraft, starter_code: e.target.value })} rows={4} className="mt-1 font-mono text-xs" /></div>
              <div><Label>Multiple-choice options (one per line)</Label><Textarea value={optionText} onChange={(e) => { setOptionText(e.target.value); setChallengeDraft({ ...challengeDraft, options: textToList(e.target.value, 8) }); }} rows={3} className="mt-1" /></div>
              <div><Label>Test cases — one per line as "input =&gt; expected output"</Label><Textarea value={testText} onChange={(e) => { setTestText(e.target.value); setChallengeDraft({ ...challengeDraft, test_cases: textToTests(e.target.value) }); }} rows={3} className="mt-1 font-mono text-xs" /></div>
              <div><Label>Hints, revealed one at a time (one per line)</Label><Textarea value={hintText} onChange={(e) => { setHintText(e.target.value); setChallengeDraft({ ...challengeDraft, hints: textToList(e.target.value, 6) }); }} rows={3} className="mt-1" /></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>XP reward</Label><Input type="number" min="5" value={challengeDraft.xp_reward ?? 30} onChange={(e) => setChallengeDraft({ ...challengeDraft, xp_reward: Number(e.target.value) })} className="mt-1" /></div>
                <label className="flex items-center gap-2 text-sm mt-6">
                  <input type="checkbox" checked={challengeDraft.published !== false} onChange={(e) => setChallengeDraft({ ...challengeDraft, published: e.target.checked })} />
                  Published
                </label>
              </div>

              <div className="border-t border-border pt-3 space-y-3">
                <p className="text-sm font-semibold">Answer &amp; explanation (students never see these)</p>
                <div><Label>Expected answer</Label><Textarea value={solutionDraft.answer || ""} onChange={(e) => setSolutionDraft({ ...solutionDraft, answer: e.target.value })} rows={2} className="mt-1 font-mono text-xs" /></div>
                <div><Label>Also accept (one per line)</Label><Textarea value={acceptedText} onChange={(e) => { setAcceptedText(e.target.value); setSolutionDraft({ ...solutionDraft, accepted_answers: textToList(e.target.value, 8) }); }} rows={2} className="mt-1 font-mono text-xs" /></div>
                <div><Label>Explanation shown after solving</Label><Textarea value={solutionDraft.explanation || ""} onChange={(e) => setSolutionDraft({ ...solutionDraft, explanation: e.target.value })} rows={3} className="mt-1" /></div>
              </div>

              <Button onClick={saveChallenge} disabled={saving} className="w-full gap-1.5">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save challenge
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              Students lose access to it immediately. Progress already recorded stays with each student.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const EMPTY_TRACK_LANGUAGE = () => ({ name: "", slug: "", tagline: "", overview: "", where_used: "", setup_guide: "", levels: STANDARD_TRACK.map((level) => ({ ...level, topics: [...level.topics] })), enabled: true, sort_order: 0 });
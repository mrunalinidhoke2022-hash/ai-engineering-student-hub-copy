import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Download, Lightbulb, Loader2, RotateCcw, Save, Shield, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "@/components/common/EmptyState";
import { AUTO_GRADED_TYPES, CHALLENGE_TYPE_LABELS, DIFFICULTY_CLASSES } from "@/components/quest/questLabels";
import { BOSS_MESSAGES, WIN_MESSAGES, WRONG_MESSAGES, pickMessage } from "@/components/quest/questMessages";
import { celebrate } from "@/lib/gameFx";
import QuestShell from "@/components/quest/QuestShell";

const WORKSPACE_NOTICE =
  "This platform never runs student code on its own servers. Automated checking uses an external secure sandbox, so until that service is connected, build and test your solution yourself and compare the output with the expected output.";

function Field({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm mt-0.5 whitespace-pre-line">{children}</div>
    </div>
  );
}

export default function QuestChallenge() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [challenge, setChallenge] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [executionAvailable, setExecutionAvailable] = useState(false);
  const [answer, setAnswer] = useState("");
  const [code, setCode] = useState("");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      base44.entities.CodingChallenge.get(id).catch(() => null),
      base44.entities.ChallengeAttempt.filter({ challenge_id: id }, { limit: 1 }),
      base44.functions.invoke("questPlay", { action: "stats" }),
    ])
      .then(([record, attemptPage, stats]) => {
        if (cancelled) return;
        const found = attemptPage.items?.[0] || null;
        setChallenge(record);
        setAttempt(found);
        setHintsUsed(found?.hints_used || 0);
        setExecutionAvailable(Boolean(stats.data?.execution_available));
        if (record) {
          const saved = localStorage.getItem(`codequest_code_${id}`);
          setCode(saved || record.starter_code || "");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const solved = attempt?.status === "solved";
  const autoGraded = AUTO_GRADED_TYPES.includes(challenge?.type);

  const saveCode = () => {
    localStorage.setItem(`codequest_code_${id}`, code);
    toast({ description: t("codequest.codeSaved") });
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(challenge?.title || "challenge").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const revealHint = async () => {
    setBusy("hint");
    try {
      const response = await base44.functions.invoke("questPlay", { action: "challenge.hint", challenge_id: id });
      setHintsUsed(response.data?.hints_used ?? hintsUsed + 1);
    } catch (error) {
      toast({ description: t("codequest.hintFailed"), variant: "destructive" });
    } finally {
      setBusy("");
    }
  };

  const submit = async (selfVerified = false) => {
    setBusy("submit");
    try {
      const response = await base44.functions.invoke("questPlay", {
        action: "challenge.submit",
        challenge_id: id,
        answer: autoGraded ? answer : code,
        self_verified: selfVerified,
      });
      const result = response.data || {};

      if (result.correct) {
        setAttempt({ ...(attempt || {}), status: "solved", hints_used: hintsUsed });
        setFeedback({ kind: "success", reward: result });
        celebrate();
        const gained = [`+${result.xp_awarded} XP`];
        if (result.xp_bonus) gained.push(`+${result.xp_bonus} bonus XP`);
        toast({ description: `${t("codequest.missionComplete")} ${gained.join(" · ")}` });
        if (result.level?.level) toast({ description: t("codequest.levelUp", { level: result.level.level }) });
        (result.new_achievements || []).forEach((badge) => {
          toast({ description: t("codequest.badgeUnlocked", { name: badge.name }) });
        });
      } else if (result.graded === false) {
        setExecutionAvailable(Boolean(result.execution_available));
        setFeedback({ kind: "info", message: result.message });
      } else {
        setAttempt({ ...(attempt || {}), attempts: result.attempts });
        setFeedback({
          kind: "wrong",
          message: result.message,
          attempts: result.attempts,
          explanation: result.explanation,
        });
      }
    } catch (error) {
      setFeedback({
        kind: "info",
        message: error?.response?.data?.error || t("codequest.submitFailed"),
      });
    } finally {
      setBusy("");
    }
  };

  if (loading) {
    return (
      <div className="quest-app min-h-screen bg-background max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-sm text-muted-foreground">{t("codequest.loading")}</p>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="quest-app min-h-screen bg-background max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <EmptyState title={t("codequest.challengeMissingTitle")} description={t("codequest.challengeMissingBody")} />
      </div>
    );
  }

  const hints = challenge.hints || [];
  const visibleTests = (challenge.test_cases || []).filter((test) => test.visible !== false);

  return (
    <QuestShell>
      <Link to={`/codequest/${challenge.language_slug}/${challenge.level_order}`} className="text-sm font-semibold text-primary">
        ← {t("codequest.backToLevel")}
      </Link>

      <div className="mt-4 rounded-3xl border-2 border-border bg-gradient-to-br from-primary/10 via-card to-gem/10 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h1 className="font-game font-extrabold text-2xl sm:text-3xl">{challenge.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                {CHALLENGE_TYPE_LABELS[challenge.type] || challenge.type}
              </span>
              {challenge.topic && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">{challenge.topic}</span>
              )}
              <span className="text-xs font-game font-extrabold px-2.5 py-1 rounded-full bg-coin/15 text-coin">
                +{challenge.xp_reward ?? 30} XP
              </span>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${DIFFICULTY_CLASSES[challenge.difficulty] || "bg-secondary text-secondary-foreground"}`}>
            {challenge.difficulty}
          </span>
        </div>
      </div>

      {solved && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-success/50 bg-gradient-to-r from-success/15 to-xp/10 p-3">
          <span className="w-9 h-9 rounded-full bg-gradient-to-br from-success to-xp text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </span>
          <p className="font-game font-extrabold text-sm text-success">{t("codequest.alreadySolved", { xp: attempt?.xp_awarded || 0 })}</p>
        </div>
      )}

      <div className="bg-card border-2 border-border rounded-3xl p-5 sm:p-6 mt-6 space-y-4">
        <Field label={t("codequest.problem")}>{challenge.problem}</Field>
        {challenge.example && <Field label={t("codequest.example")}>{challenge.example}</Field>}

        {(challenge.expected_input || challenge.expected_output) && (
          <div className="grid sm:grid-cols-2 gap-3">
            {challenge.expected_input && (
              <div className="bg-secondary rounded-md p-3">
                <p className="text-xs font-semibold mb-1">{t("codequest.expectedInput")}</p>
                <p className="font-mono text-xs whitespace-pre-line">{challenge.expected_input}</p>
              </div>
            )}
            {challenge.expected_output && (
              <div className="bg-secondary rounded-md p-3">
                <p className="text-xs font-semibold mb-1">{t("codequest.expectedOutput")}</p>
                <p className="font-mono text-xs whitespace-pre-line">{challenge.expected_output}</p>
              </div>
            )}
          </div>
        )}

        {challenge.constraints && <Field label={t("codequest.constraints")}>{challenge.constraints}</Field>}

        {visibleTests.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("codequest.testCases")}</p>
            <div className="space-y-1.5 mt-2">
              {visibleTests.map((test, index) => (
                <div key={index} className="font-mono text-xs bg-secondary rounded-md p-2.5 whitespace-pre-line">
                  {test.input ? `in:  ${test.input}\n` : ""}
                  {test.expected_output ? `out: ${test.expected_output}` : ""}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-card border-2 border-border rounded-3xl p-5 sm:p-6 mt-6">
        <h2 className="font-game font-extrabold text-xl">{autoGraded ? t("codequest.yourAnswer") : t("codequest.workspace")}</h2>

        {autoGraded && challenge.type === "multiple_choice" && (challenge.options || []).length > 0 ? (
          <div className="mt-3 space-y-2">
            {(challenge.options || []).map((option, index) => (
              <button
                key={option}
                type="button"
                onClick={() => setAnswer(option)}
                disabled={solved}
                className={`w-full flex items-center gap-3 text-left text-sm border-2 rounded-2xl p-3 transition-all active:scale-[.99] ${
                  answer === option
                    ? "border-primary bg-gradient-to-r from-primary/15 to-xp/10 shadow-game"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-xl font-game font-extrabold flex items-center justify-center shrink-0 ${
                    answer === option ? "bg-gradient-to-br from-primary to-xp text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="min-w-0">{option}</span>
              </button>
            ))}
          </div>
        ) : autoGraded ? (
          <Textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            rows={6}
            maxLength={2000}
            disabled={solved}
            placeholder={t("codequest.answerPlaceholder")}
            className="font-mono text-xs mt-3"
          />
        ) : (
          <>
            <Textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              rows={12}
              maxLength={4000}
              disabled={solved}
              placeholder={t("codequest.codePlaceholder")}
              className="font-mono text-xs mt-3"
            />
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={saveCode} className="gap-1.5">
                <Save className="w-4 h-4" /> {t("codequest.saveCode")}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadCode} className="gap-1.5">
                <Download className="w-4 h-4" /> {t("codequest.downloadCode")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCode(challenge.starter_code || "")}
                className="gap-1.5"
                disabled={solved}
              >
                <RotateCcw className="w-4 h-4" /> {t("codequest.resetCode")}
              </Button>
              <Button variant="outline" size="sm" disabled title={t("codequest.runDisabled")} className="gap-1.5">
                <Shield className="w-4 h-4" /> {t("codequest.run")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">{WORKSPACE_NOTICE}</p>
          </>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Button
            onClick={() => submit(false)}
            disabled={solved || busy === "submit"}
            className="gap-1.5 h-11 rounded-full font-game font-bold bg-gradient-to-r from-primary to-xp text-primary-foreground shadow-game active:scale-[.97] transition-transform"
          >
            {busy === "submit" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {autoGraded ? t("codequest.submitAnswer") : t("codequest.checkWork")}
          </Button>
          {feedback?.kind === "info" && !solved && (
            <Button variant="outline" onClick={() => submit(true)} disabled={busy === "submit"} className="h-11 rounded-full font-game font-bold border-2">
              {t("codequest.markBuilt")}
            </Button>
          )}
        </div>
      </div>

      {hints.length > 0 && (
        <div className="rounded-3xl border-2 border-warning/50 bg-warning/5 p-5 sm:p-6 mt-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-game font-extrabold text-xl flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-warning" /> {t("codequest.hints")}
            </h2>
            {hintsUsed < hints.length && (
              <Button variant="outline" size="sm" onClick={revealHint} disabled={busy === "hint"}>
                {busy === "hint" ? <Loader2 className="w-4 h-4 animate-spin" /> : t("codequest.showHint")}
              </Button>
            )}
          </div>
          {hintsUsed === 0 ? (
            <p className="text-sm text-muted-foreground mt-2">{t("codequest.hintsHint")}</p>
          ) : (
            <ol className="space-y-2 mt-3">
              {hints.slice(0, hintsUsed).map((hint, index) => (
                <li key={index} className="text-sm">
                  <span className="font-semibold">{index + 1}. </span>
                  {hint}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {feedback && (
        <div className="mt-6">
          {feedback.kind === "success" && (
            <div className="rounded-2xl border-2 border-success/50 bg-gradient-to-br from-success/15 via-card to-xp/10 p-5 shadow-game animate-game-pop motion-reduce:animate-none">
              <p className="font-game font-extrabold text-xl text-success flex items-center gap-2">
                🎉 {t("codequest.missionComplete")} +{feedback.reward?.xp_awarded} XP
              </p>
              <p className="text-sm text-success mt-1">
                {pickMessage(
                  challenge.type === "build_mini_app" || challenge.type === "build_function" ? BOSS_MESSAGES : WIN_MESSAGES,
                  challenge.title?.length || 0
                )}
              </p>
              {feedback.reward?.xp_bonus > 0 && (
                <p className="text-sm text-success mt-1">
                  {t("codequest.bonusXp", { xp: feedback.reward.xp_bonus })}
                </p>
              )}
              {(feedback.reward?.new_achievements || []).map((badge) => (
                <p key={badge.key} className="text-sm text-success mt-1">
                  {t("codequest.badgeUnlocked", { name: badge.name })}
                </p>
              ))}
              {feedback.reward?.explanation && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("codequest.explanation")}</p>
                  <p className="text-sm mt-0.5">{feedback.reward.explanation}</p>
                </div>
              )}
            </div>
          )}

          {feedback.kind === "wrong" && (
            <div className="rounded-2xl border-2 border-warning/50 bg-warning/10 p-5">
              <p className="font-game font-extrabold text-lg text-warning flex items-center gap-2">
                <XCircle className="w-5 h-5" /> {feedback.message}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("codequest.attemptsSoFar", { count: feedback.attempts || 0 })}
              </p>
              <p className="text-sm mt-1">{pickMessage(WRONG_MESSAGES, feedback.attempts)}</p>
              {feedback.explanation && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("codequest.explanation")}</p>
                  <p className="text-sm mt-0.5">{feedback.explanation}</p>
                </div>
              )}
            </div>
          )}

          {feedback.kind === "info" && (
            <div className="rounded-2xl border-2 border-border bg-secondary p-4">
              <p className="text-sm">{feedback.message}</p>
              {executionAvailable && (
                <p className="text-xs text-muted-foreground mt-1">{t("codequest.runnerPending")}</p>
              )}
            </div>
          )}
        </div>
      )}
    </QuestShell>
  );
}
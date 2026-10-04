import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { describeError } from "@/lib/authErrors";
import EmptyState from "@/components/common/EmptyState";
import ProposalCard from "./ProposalCard";
import ProposalReviewDialog from "./ProposalReviewDialog";

const PENDING = { status: { $in: ["new", "updated", "needs_review"] } };
const KINDS = ["", "new_tool", "tool_update", "price_change", "learning_resource", "hackathon", "announcement"];

// Everything waiting on a decision, with a filter for the kind of content.
export default function ReviewQueue({ reloadKey, onChanged }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState("");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();

  const load = useCallback(() => {
    setLoading(true);
    const query = kind ? { ...PENDING, kind } : PENDING;
    return base44.entities.ContentUpdate.filter(query, { sort: "-discovered_at", limit: 30 })
      .then((page) => setItems(page.items))
      .finally(() => setLoading(false));
  }, [kind]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const act = async (proposal, action) => {
    setBusy(proposal.id);
    try {
      const { data } = await base44.functions.invoke("reviewContentUpdate", { id: proposal.id, action });
      if (data?.error) {
        toast({ description: t("adminUpdates.publishFailed"), variant: "destructive" });
        return;
      }
      toast({ description: action === "publish" ? t("adminUpdates.published") : t("adminUpdates.rejected") });
      await load();
      onChanged?.();
    } catch (err) {
      toast({ description: describeError(t, err, "errors.generic"), variant: "destructive" });
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto scroll-touch pb-1">
        {KINDS.map((option) => (
          <button
            key={option || "all"}
            type="button"
            onClick={() => setKind(option)}
            className={`shrink-0 min-h-[36px] text-xs font-semibold px-3 rounded-full border transition-colors ${
              kind === option ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {option ? t(`adminUpdates.kind.${option}`) : t("adminUpdates.allKinds")}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : items.length === 0 ? (
        <EmptyState title={t("adminUpdates.emptyQueue")} description={t("adminUpdates.emptyQueueDesc")} />
      ) : (
        <div className="space-y-3">
          {items.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              busy={busy === proposal.id}
              onReview={setSelected}
              onPublish={(item) => act(item, "publish")}
              onReject={(item) => act(item, "reject")}
            />
          ))}
        </div>
      )}

      <ProposalReviewDialog
        proposal={selected}
        open={!!selected}
        onOpenChange={(next) => !next && setSelected(null)}
        onChanged={async () => {
          await load();
          onChanged?.();
        }}
      />
    </div>
  );
}
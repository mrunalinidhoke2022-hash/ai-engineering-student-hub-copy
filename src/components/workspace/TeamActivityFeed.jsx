import React, { useEffect, useState } from "react";
import moment from "moment";
import { Activity, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const KIND_LABEL = {
  joined: "Joined",
  left: "Left",
  roadmap_shared: "Roadmap",
  update: "Update",
};

export default function TeamActivityFeed({ teamId, canPost }) {
  const { toast } = useToast();
  const [updates, setUpdates] = useState([]);
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);

  const load = () =>
    base44.entities.TeamUpdate.filter({ team_id: teamId }, { sort: "-created_date", limit: 30 }).then((page) =>
      setUpdates(page.items)
    );

  useEffect(() => {
    load();
  }, [teamId]);

  const post = async () => {
    const text = message.trim();
    if (!text) return;
    setPosting(true);
    const { data } = await base44.functions.invoke("teamActions", {
      action: "post_update",
      team_id: teamId,
      message: text,
    });
    if (data?.error) {
      toast({ description: data.error, variant: "destructive" });
    } else {
      setMessage("");
      await load();
    }
    setPosting(false);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="font-heading font-bold text-sm">Team activity</h3>
      </div>

      {canPost && (
        <div className="flex items-center gap-2 mt-3">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Post a short update for the team..."
            maxLength={300}
            className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button size="sm" onClick={post} disabled={posting || !message.trim()} className="gap-1.5 shrink-0">
            <Send className="w-3.5 h-3.5" /> {posting ? "Posting" : "Post"}
          </Button>
        </div>
      )}

      {updates.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-4">Nothing here yet — joins, shared roadmaps and updates show up here.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {updates.map((update) => (
            <li key={update.id} className="py-3 first:pt-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold">{update.author_name || "Teammate"}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-accent rounded-full px-2 py-0.5">
                  {KIND_LABEL[update.kind] || "Update"}
                </span>
                <span className="text-[11px] text-muted-foreground ml-auto">
                  {moment(update.created_date).fromNow()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{update.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
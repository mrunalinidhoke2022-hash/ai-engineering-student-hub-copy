import React, { useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TaskCommentItem from "./TaskCommentItem";

export default function TaskCommentDialog({ team, task, open, onOpenChange, onPosted }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!open || !task) return;
    let active = true;
    setLoading(true);
    setMessage("");
    base44.entities.TaskComment.filter({ task_id: task.id }, { sort: "created_date", limit: 100 }).then((page) => {
      if (!active) return;
      setComments(page.items);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [open, task?.id]);

  const post = async () => {
    const text = message.trim();
    if (!text) return;
    setPosting(true);
    try {
      // Read the team again so a teammate who joined moments ago can take part.
      const fresh = await base44.entities.Team.get(team.id).catch(() => team);
      const created = await base44.entities.TaskComment.create({
        team_id: team.id,
        task_id: task.id,
        message: text,
        author_name: user?.full_name || user?.email || "",
        team_members: fresh?.members || team.members || [],
      });
      setComments((prev) => [...prev, created]);
      setMessage("");
      onPosted?.(task.id);
    } catch {
      toast({ description: "Could not post that comment. Please try again.", variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const remove = async (comment) => {
    setComments((prev) => prev.filter((item) => item.id !== comment.id));
    try {
      await base44.entities.TaskComment.delete(comment.id);
      onPosted?.(task.id);
    } catch {
      toast({ description: "Could not delete that comment. Please try again.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <MessageSquare className="w-4 h-4 text-primary" /> Task discussion
          </DialogTitle>
          <DialogDescription className="break-words">{task?.title}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[45vh] overflow-y-auto space-y-4 pr-1 mt-1">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No comments yet — start the discussion so your teammates know where things stand.
            </p>
          ) : (
            comments.map((comment) => (
              <TaskCommentItem
                key={comment.id}
                comment={comment}
                canDelete={comment.created_by_id === user?.id}
                onDelete={remove}
              />
            ))
          )}
        </div>

        <div className="space-y-2 pt-3 border-t border-border">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a comment for your team..."
            maxLength={500}
            rows={3}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-muted-foreground">{message.length}/500</span>
            <Button size="sm" className="gap-1.5" onClick={post} disabled={posting || !message.trim()}>
              <Send className="w-3.5 h-3.5" /> {posting ? "Posting..." : "Post comment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
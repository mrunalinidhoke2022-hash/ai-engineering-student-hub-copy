import React, { useCallback, useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import KanbanColumn from "./KanbanColumn";
import KanbanBulkBar from "./KanbanBulkBar";
import TaskCommentDialog from "./TaskCommentDialog";
import { TASK_STATUSES } from "./taskStatuses";
import useBoardDrag from "@/hooks/useBoardDrag";

export default function TeamKanbanBoard({ team, onChanged }) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [commentCounts, setCommentCounts] = useState({});
  const [discussing, setDiscussing] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const load = useCallback(async () => {
    const page = await base44.entities.TeamTask.filter({ team_id: team.id }, { sort: "created_date", limit: 100 });
    setTasks(page.items);
    setLoading(false);
  }, [team.id]);

  // One grouped count keeps every card's comment badge accurate.
  const loadCommentCounts = useCallback(async () => {
    const result = await base44.entities.TaskComment.aggregate({ query: { team_id: team.id }, groupBy: "task_id" });
    setCommentCounts(Object.fromEntries((result.rows || []).map((row) => [row.task_id, row.count])));
  }, [team.id]);

  useEffect(() => {
    load();
    loadCommentCounts();
  }, [load, loadCommentCounts]);

  // A selection belongs to the team that was on screen when it was made.
  useEffect(() => {
    setSelectedIds([]);
  }, [team.id]);

  const addTask = async (status, title, assignee) => {
    // The team function checks membership and stamps the author, so the board cannot be
    // written to by anyone who is not on the team.
    const response = await base44.functions.invoke("teamActions", {
      action: "add_task",
      team_id: team.id,
      title,
      status,
      assignee,
    });
    const created = response.data?.task;
    if (!created) {
      toast({ description: response.data?.error || "Could not add that task. Please try again.", variant: "destructive" });
      return;
    }
    setTasks((prev) => [...prev, created]);
    onChanged?.();
  };

  const removeTask = async () => {
    const task = pendingDelete;
    setPendingDelete(null);
    if (!task) return;
    setTasks((prev) => prev.filter((item) => item.id !== task.id));
    try {
      await base44.entities.TeamTask.delete(task.id);
      await base44.entities.TaskComment.deleteMany({ task_id: task.id });
      setCommentCounts((prev) => {
        const next = { ...prev };
        delete next[task.id];
        return next;
      });
      onChanged?.();
    } catch {
      await load();
      toast({ description: "Could not delete that task. Please try again.", variant: "destructive" });
    }
  };

  const setStatus = useCallback(
    async (taskId, status) => {
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status } : task)));
      try {
        await base44.entities.TeamTask.update(taskId, { status });
        onChanged?.();
      } catch {
        await load();
        toast({ description: "Could not move that task. Please try again.", variant: "destructive" });
      }
    },
    [load, onChanged, toast]
  );

  const { dragId, overStatus, offset, startDrag } = useBoardDrag(setStatus);

  // Arrow controls on a card, so a task can be moved without a drag gesture.
  const moveTask = (task, direction) => {
    const index = Math.max(0, TASK_STATUSES.findIndex((status) => status.key === task.status));
    const next = TASK_STATUSES[index + direction];
    if (next) setStatus(task.id, next.key);
  };

  const selectedTasks = tasks.filter((task) => selectedIds.includes(task.id));
  // Only offer a column the selection isn't already sitting in.
  const moveTargets = TASK_STATUSES.filter((status) => selectedTasks.some((task) => task.status !== status.key));

  const toggleSelect = (taskId) => {
    setSelectedIds((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]));
  };

  // One grouped write moves the whole selection.
  const bulkMove = async (status) => {
    const ids = selectedTasks.map((task) => task.id);
    setBulkBusy(true);
    setTasks((prev) => prev.map((task) => (ids.includes(task.id) ? { ...task, status } : task)));
    try {
      await base44.entities.TeamTask.bulkUpdate(ids.map((id) => ({ id, status })));
      setSelectedIds([]);
      onChanged?.();
    } catch {
      await load();
      toast({ description: "Could not move those tasks. Please try again.", variant: "destructive" });
    }
    setBulkBusy(false);
  };

  const bulkDelete = async () => {
    const ids = selectedTasks.map((task) => task.id);
    setConfirmBulkDelete(false);
    setBulkBusy(true);
    setTasks((prev) => prev.filter((task) => !ids.includes(task.id)));
    try {
      await base44.entities.TeamTask.deleteMany({ id: { $in: ids } });
      await base44.entities.TaskComment.deleteMany({ task_id: { $in: ids } });
      setCommentCounts((prev) => {
        const next = { ...prev };
        ids.forEach((id) => delete next[id]);
        return next;
      });
      setSelectedIds([]);
      onChanged?.();
    } catch {
      await load();
      loadCommentCounts();
      toast({ description: "Could not delete those tasks. Please try again.", variant: "destructive" });
    }
    setBulkBusy(false);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          <h3 className="font-heading font-bold text-sm">Project board</h3>
        </div>
        <p className="text-[11px] text-muted-foreground">Drag a task between columns to update its status.</p>
      </div>

      <KanbanBulkBar
        count={selectedIds.length}
        moveTargets={moveTargets}
        busy={bulkBusy}
        onMove={bulkMove}
        onDelete={() => setConfirmBulkDelete(true)}
        onClear={() => setSelectedIds([])}
      />

      {loading ? (
        <p className="text-sm text-muted-foreground mt-4">Loading tasks...</p>
      ) : (
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          {TASK_STATUSES.map((column) => (
            <KanbanColumn
              key={column.key}
              column={column}
              tasks={tasks.filter((task) => task.status === column.key)}
              assignees={team.member_names || []}
              commentCounts={commentCounts}
              canEdit
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              dragId={dragId}
              dragOffset={offset}
              isDropTarget={overStatus === column.key}
              onDragStart={startDrag}
              onOpenComments={setDiscussing}
              onAdd={addTask}
              onRequestDelete={setPendingDelete}
              onMove={moveTask}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(next) => !next && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              "{pendingDelete?.title}" will be removed from the team board for everyone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeTask}>Delete task</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.length} task{selectedIds.length === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              These tasks and their comments will be removed from the team board for everyone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={bulkDelete}>Delete tasks</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TaskCommentDialog
        team={team}
        task={discussing}
        open={!!discussing}
        onOpenChange={(next) => !next && setDiscussing(null)}
        onPosted={loadCommentCounts}
      />
    </div>
  );
}
import React, { useCallback, useEffect, useRef, useState } from "react";
import { BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { base44 } from "@/api/base44Client";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const CHART_CONFIG = {
  todo: { label: "To Do", color: "hsl(var(--chart-4))" },
  in_progress: { label: "In Progress", color: "hsl(var(--chart-1))" },
  completed: { label: "Completed", color: "hsl(var(--chart-2))" },
  pending: { label: "Pending", color: "hsl(var(--chart-4))" },
  tasks: { label: "Tasks" },
};

const STATUSES = [
  { key: "todo", label: "To Do", dot: "bg-chart-4" },
  { key: "in_progress", label: "In Progress", dot: "bg-chart-1" },
  { key: "completed", label: "Completed", dot: "bg-chart-2" },
];

export default function TeamProgressSummary({ team, refreshKey }) {
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const newestRequest = useRef(0);

  // One grouped count on the server — never a full task list in the browser.
  const load = useCallback(async () => {
    const token = (newestRequest.current += 1);
    const result = await base44.entities.TeamTask.aggregate({ query: { team_id: team.id }, groupBy: "status" });
    // Moving a task fires several counts in a row; a slow earlier one must never
    // overwrite the newest, or the chart keeps showing counts the board has moved past.
    if (token !== newestRequest.current) return;

    const next = { todo: 0, in_progress: 0, completed: 0 };
    (result.rows || []).forEach((row) => {
      if (row.status in next) next[row.status] = row.count;
    });
    setCounts(next);
    setLoading(false);
  }, [team.id]);

  // `refreshKey` changes whenever a teammate adds, moves or deletes a task on the board.
  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const todo = counts?.todo || 0;
  const inProgress = counts?.in_progress || 0;
  const completed = counts?.completed || 0;
  const total = todo + inProgress + completed;
  const pending = todo + inProgress;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  const donutData = STATUSES.map((status) => ({ key: status.key, tasks: counts?.[status.key] || 0 }));
  const compareData = [
    { label: "Completed", tasks: completed, fill: "var(--color-completed)" },
    { label: "Pending", tasks: pending, fill: "var(--color-pending)" },
  ];

  const tiles = [
    { label: "Total tasks", value: total, className: "text-foreground" },
    { label: "Completed", value: completed, className: "text-chart-2" },
    { label: "Still pending", value: pending, className: "text-chart-4" },
    { label: "Completion", value: `${percent}%`, className: "text-primary" },
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="font-heading font-bold text-sm">Task summary</h3>
        </div>
        <p className="text-xs text-muted-foreground">Completed versus pending work on this team's board.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground mt-4">Counting tasks...</p>
      ) : total === 0 ? (
        <p className="text-sm text-muted-foreground mt-4">
          No tasks yet — add a few to the board below and your team's pace will show up here.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {tiles.map((tile) => (
              <div key={tile.label} className="rounded-lg border border-border bg-background px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{tile.label}</p>
                <p className={`font-heading font-extrabold text-2xl mt-1 ${tile.className}`}>{tile.value}</p>
              </div>
            ))}
          </div>

          <div className="h-1.5 rounded-full bg-muted mt-3 overflow-hidden">
            <div className="h-full rounded-full bg-chart-2 transition-all" style={{ width: `${percent}%` }} />
          </div>

          <div className="grid sm:grid-cols-2 gap-5 mt-5">
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Where the work stands
              </p>
              <ChartContainer config={CHART_CONFIG} className="aspect-auto h-[170px] w-full mt-1">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="tasks"
                    nameKey="key"
                    innerRadius={42}
                    outerRadius={68}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {donutData.map((slice) => (
                      <Cell key={slice.key} fill={`var(--color-${slice.key})`} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <ul className="mt-2 space-y-1.5">
                {STATUSES.map((status) => (
                  <li key={status.key} className="flex items-center gap-2 text-xs">
                    <span className={`w-2.5 h-2.5 rounded-[3px] shrink-0 ${status.dot}`} />
                    <span className="text-muted-foreground">{status.label}</span>
                    <span className="ml-auto font-mono font-medium tabular-nums">
                      {counts?.[status.key] || 0}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Completed vs pending
              </p>
              <ChartContainer config={CHART_CONFIG} className="aspect-auto h-[220px] w-full mt-1">
                <BarChart data={compareData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis width={30} allowDecimals={false} tickLine={false} axisLine={false} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar dataKey="tasks" radius={[6, 6, 0, 0]} maxBarSize={72}>
                    {compareData.map((entry) => (
                      <Cell key={entry.label} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
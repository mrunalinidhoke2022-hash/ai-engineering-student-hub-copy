import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import moment from "moment";

export default function ActivityFeed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Activity.filter({}, { sort: "-created_date", limit: 50 })
      .then((p) => setItems(p.items))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mt-10">
      <h2 className="font-heading font-bold text-lg">Student Activity</h2>
      <p className="text-sm text-muted-foreground mt-1">What logged-in students have been exploring, newest first.</p>

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading activity...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-card border border-border rounded-lg p-5">
            No activity recorded yet. Student visits will appear here once they start exploring.
          </p>
        ) : (
          <div className="border border-border rounded-lg divide-y divide-border overflow-hidden bg-card">
            {items.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 p-3.5">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{a.student || "Student"}</p>
                  <p className="text-xs text-muted-foreground">{a.action}</p>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">{moment(a.created_date).fromNow()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
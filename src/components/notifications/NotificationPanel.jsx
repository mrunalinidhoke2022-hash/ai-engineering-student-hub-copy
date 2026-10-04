import React, { useEffect, useState } from "react";
import { Bell, Megaphone } from "lucide-react";
import { Link } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { base44 } from "@/api/base44Client";
import moment from "moment";

const CATEGORY_CLASSES = {
  "Site Update": "bg-accent text-accent-foreground",
  "New Feature": "bg-accent text-accent-foreground",
  Hackathon: "bg-primary/10 text-primary",
  Deadline: "bg-destructive/10 text-destructive",
  "Code Review": "bg-primary/10 text-primary",
  Event: "bg-secondary text-secondary-foreground",
  General: "bg-secondary text-secondary-foreground",
};

// Shared between the desktop and mobile bell so browsing pages doesn't refetch
// the same announcements twice per page view.
const CACHE_TTL_MS = 60000;
let cache = { userId: null, at: 0, items: [], unread: 0 };
let inFlight = null;

// Both bells (desktop and mobile) mount together, so the fetch itself is shared:
// whichever one starts it, the other waits on the same requests instead of
// repeating them on every page.
async function fetchNotifications(user) {
  const seenAt = user?.notifications_seen_at;
  const [announcements, reviews] = await Promise.all([
    base44.entities.Announcement.filter({}, { sort: "-created_date", limit: 20 }),
    base44.entities.CodeReview.filter(
      { has_issues: true },
      { sort: "-created_date", limit: 10, fields: ["problem_id", "problem_title", "summary", "created_date"] }
    ),
  ]);
  const [announcementUnread, reviewUnread] = await Promise.all([
    base44.entities.Announcement.count(seenAt ? { created_date: { $gt: seenAt } } : {}),
    base44.entities.CodeReview.count(seenAt ? { has_issues: true, created_date: { $gt: seenAt } } : { has_issues: true }),
  ]);
  // Personal code-review alerts sit alongside the site-wide announcements, and only
  // ever hold the signed-in student's own reviews.
  const items = [
    ...announcements.items.map((a) => ({ id: a.id, badge: a.category, title: a.title, message: a.message, link: a.link, created_date: a.created_date })),
    ...reviews.items.map((r) => ({
      id: r.id,
      badge: "Code Review",
      title: `Feedback on ${r.problem_title}`,
      message: r.summary,
      link: `/coding-practice/${r.problem_id}`,
      created_date: r.created_date,
    })),
  ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  return { items, unread: announcementUnread + reviewUnread };
}

export default function NotificationPanel({ user }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (cache.userId === user.id && Date.now() - cache.at < CACHE_TTL_MS) {
      setItems(cache.items);
      setUnread(cache.unread);
      return;
    }
    if (!inFlight) {
      inFlight = fetchNotifications(user)
        .then((data) => {
          cache = { userId: user.id, at: Date.now(), ...data };
          return cache;
        })
        .finally(() => {
          inFlight = null;
        });
    }
    const pending = inFlight;
    let data;
    try {
      data = await pending;
    } catch {
      // The bell is a side panel: a failed load leaves it empty rather than breaking the page.
      return;
    }
    setItems(data.items);
    setUnread(data.unread);
  };

  useEffect(() => {
    if (user?.id) load();
  }, [user?.id]);

  const handleOpenChange = async (next) => {
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      cache = { ...cache, unread: 0 };
      await base44.auth.updateMe({ notifications_seen_at: new Date().toISOString() });
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Megaphone className="w-4 h-4 text-primary" />
          <p className="font-heading font-bold text-sm">Updates & Alerts</p>
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 py-8 text-center">
              No updates yet. You'll see new features, hackathon alerts and deadlines here.
            </p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="px-4 py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      CATEGORY_CLASSES[item.badge] || "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {item.badge}
                  </span>
                  <span className="text-xs text-muted-foreground">{moment(item.created_date).fromNow()}</span>
                </div>
                <p className="font-semibold text-sm mt-1.5">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.message}</p>
                {item.link && (
                  <Link to={item.link} onClick={() => setOpen(false)} className="text-xs font-semibold text-primary mt-1.5 inline-block">
                    Open →
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
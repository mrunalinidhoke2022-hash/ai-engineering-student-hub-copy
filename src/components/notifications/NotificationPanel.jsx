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
  Event: "bg-secondary text-secondary-foreground",
  General: "bg-secondary text-secondary-foreground",
};

// Shared between the desktop and mobile bell so browsing pages doesn't refetch
// the same announcements twice per page view.
const CACHE_TTL_MS = 60000;
let cache = { userId: null, at: 0, items: [], unread: 0 };

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
    const page = await base44.entities.Announcement.filter({}, { sort: "-created_date", limit: 20 });
    const seenAt = user?.notifications_seen_at;
    const unreadCount = seenAt
      ? await base44.entities.Announcement.count({ created_date: { $gt: seenAt } })
      : page.items.length;
    cache = { userId: user.id, at: Date.now(), items: page.items, unread: unreadCount };
    setItems(page.items);
    setUnread(unreadCount);
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
                      CATEGORY_CLASSES[item.category] || "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {item.category}
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
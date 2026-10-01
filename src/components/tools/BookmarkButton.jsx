import React, { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function BookmarkButton({ itemType, itemId, itemName, folder = "My AI Tools", size = "sm", saved, onToggle }) {
  const [bookmarkId, setBookmarkId] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  // Inside a list, the parent resolves save state for every item in one request
  // (see useSavedBookmarks) and passes its own toggle down.
  const controlled = onToggle !== undefined;

  useEffect(() => {
    if (controlled) return;
    let active = true;
    base44.entities.Bookmark.filter({ item_type: itemType, item_id: itemId }, { limit: 1 })
      .then((page) => {
        if (active) setBookmarkId(page.items[0]?.id || null);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [itemType, itemId, controlled]);

  const toggle = async () => {
    if (controlled) {
      await onToggle({ id: itemId, name: itemName });
      toast({ description: saved ? "Removed from My Toolkit" : "Saved to My Toolkit" });
      return;
    }
    if (bookmarkId) {
      await base44.entities.Bookmark.delete(bookmarkId);
      setBookmarkId(null);
      toast({ description: "Removed from My Toolkit" });
    } else {
      const created = await base44.entities.Bookmark.create({ item_type: itemType, item_id: itemId, item_name: itemName, folder });
      setBookmarkId(created.id);
      toast({ description: "Saved to My Toolkit" });
    }
  };

  const isSaved = controlled ? !!saved : !!bookmarkId;

  return (
    <Button variant={isSaved ? "default" : "outline"} size={size} onClick={toggle} disabled={!controlled && loading} className="gap-1.5">
      <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
      {isSaved ? "Saved" : "Save to Toolkit"}
    </Button>
  );
}
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Resolves save state for a whole list of items in a single request
 * (instead of one request per card, which trips the API rate limit).
 */
export default function useSavedBookmarks(itemType, items, folder = "My AI Tools") {
  const [savedMap, setSavedMap] = useState(() => new Map());
  const idsKey = (items || []).map((item) => item.id).join(",");

  useEffect(() => {
    if (!idsKey) {
      setSavedMap(new Map());
      return;
    }
    let active = true;
    base44.entities.Bookmark
      .filter({ item_type: itemType, item_id: { $in: idsKey.split(",") } }, { limit: 200, fields: ["item_id"] })
      .then((page) => {
        if (active) setSavedMap(new Map(page.items.map((bookmark) => [bookmark.item_id, bookmark.id])));
      });
    return () => {
      active = false;
    };
  }, [itemType, idsKey]);

  const isSaved = (id) => savedMap.has(id);

  const toggle = async ({ id, name }) => {
    const existingId = savedMap.get(id);

    if (existingId) {
      // Show the change straight away, then confirm it with the API.
      setSavedMap((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      try {
        await base44.entities.Bookmark.delete(existingId);
      } catch (error) {
        setSavedMap((prev) => new Map(prev).set(id, existingId));
        throw error;
      }
      return;
    }

    const pendingId = `pending-${id}`;
    setSavedMap((prev) => new Map(prev).set(id, pendingId));
    try {
      const created = await base44.entities.Bookmark.create({
        item_type: itemType,
        item_id: id,
        item_name: name,
        folder,
      });
      setSavedMap((prev) => {
        const next = new Map(prev);
        if (next.get(id) === pendingId) next.set(id, created.id);
        return next;
      });
    } catch (error) {
      setSavedMap((prev) => {
        const next = new Map(prev);
        if (next.get(id) === pendingId) next.delete(id);
        return next;
      });
      throw error;
    }
  };

  return { isSaved, toggle };
}
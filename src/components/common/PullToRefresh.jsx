import React, { useEffect, useRef, useState } from "react";
import { ArrowDown, Loader2 } from "lucide-react";

const THRESHOLD = 70;
const MAX_PULL = 110;

// Mobile pull-to-refresh. Touch-only: on desktop it renders nothing and never
// interferes with scrolling. Drop it as the first child of a page's root element
// and pass the page's own data-loading function as onRefresh.
export default function PullToRefresh({ onRefresh }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const handlerRef = useRef(onRefresh);
  handlerRef.current = onRefresh;

  useEffect(() => {
    const setPullValue = (value) => {
      pullRef.current = value;
      setPull(value);
    };

    const onStart = (event) => {
      if (refreshingRef.current || window.scrollY > 0 || event.touches.length !== 1) return;
      startY.current = event.touches[0].clientY;
    };

    const onMove = (event) => {
      if (startY.current === null || refreshingRef.current) return;
      const delta = event.touches[0].clientY - startY.current;
      if (delta <= 0) {
        setPullValue(0);
        return;
      }
      if (window.scrollY > 0) {
        startY.current = null;
        setPullValue(0);
        return;
      }
      setPullValue(Math.min(MAX_PULL, delta * 0.5));
    };

    const onEnd = async () => {
      if (startY.current === null) return;
      startY.current = null;
      if (pullRef.current < THRESHOLD) {
        setPullValue(0);
        return;
      }
      refreshingRef.current = true;
      setRefreshing(true);
      setPullValue(THRESHOLD);
      try {
        await handlerRef.current?.();
      } finally {
        refreshingRef.current = false;
        setRefreshing(false);
        setPullValue(0);
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  if (!refreshing && pull === 0) return null;

  const ready = pull >= THRESHOLD;

  return (
    <div
      className="fixed left-0 right-0 top-16 z-30 flex justify-center pointer-events-none"
      style={{
        transform: `translateY(${refreshing ? 0 : pull - 56}px)`,
        transition: refreshing || pull === 0 ? "transform 0.2s ease" : "none",
      }}
      aria-hidden="true"
    >
      <div className="flex items-center gap-2 rounded-full bg-card border border-border shadow-md px-3 py-1.5 text-xs font-medium text-muted-foreground">
        {refreshing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <ArrowDown
            className="w-3.5 h-3.5 transition-transform"
            style={{ transform: ready ? "rotate(180deg)" : "none" }}
          />
        )}
        {refreshing ? "Refreshing…" : ready ? "Release to refresh" : "Pull to refresh"}
      </div>
    </div>
  );
}
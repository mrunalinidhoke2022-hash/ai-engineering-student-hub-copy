import React from "react";

// Suspense fallback shown while a lazily loaded page chunk arrives.
export default function PageLoader() {
  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );
}
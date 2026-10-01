import React from "react";
import { SearchX } from "lucide-react";

export default function EmptyState({ title = "Nothing here yet", description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
        <SearchX className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
    </div>
  );
}
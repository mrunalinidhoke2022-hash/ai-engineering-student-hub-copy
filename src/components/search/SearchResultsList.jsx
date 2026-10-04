import React from "react";
import { Link } from "react-router-dom";

export default function SearchResultsList({ groups, onNavigate, maxPerGroup }) {
  return (
    <div>
      {groups.map((group) => {
        const items = maxPerGroup ? group.items.slice(0, maxPerGroup) : group.items;
        return (
          <section key={group.key} className="mb-4 last:mb-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{group.title}</p>
            <div className="space-y-1.5">
              {items.map((item) => (
                <Link
                  key={`${group.key}-${item.id}`}
                  to={item.to}
                  onClick={() => onNavigate?.()}
                  className="block rounded-md border border-border bg-card p-2.5 hover:border-primary/40 transition-colors"
                >
                  <p className="text-sm font-semibold leading-snug">{item.title}</p>
                  {item.subtitle ? <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.subtitle}</p> : null}
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
"use client";

import type { FeedMode } from "@/types";
import { copy } from "@/lib/gambas-copy";
import { cn } from "@/lib/utils";

interface FeedTabsProps {
  mode: FeedMode;
  onChange: (mode: FeedMode) => void;
}

const tabs: { id: FeedMode; label: string }[] = [
  { id: "foryou", label: copy.feedForYou },
  { id: "following", label: copy.feedFollowing },
];

export function FeedTabs({ mode, onChange }: FeedTabsProps) {
  return (
    <div className="flex border-b border-gambas-border/40">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex-1 py-3 text-sm font-semibold transition-colors relative",
            mode === tab.id
              ? "text-gambas-text"
              : "text-gambas-muted hover:text-gambas-text"
          )}
        >
          {tab.label}
          {mode === tab.id && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gambas-accent rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

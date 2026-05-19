"use client";

import type { PostWithAuthor, ReactionEmoji } from "@/types";
import { REACTION_EMOJIS } from "@/types";
import { cn } from "@/lib/utils";

interface QuickReactionsProps {
  post: PostWithAuthor;
  onReact: (postId: string, emoji: ReactionEmoji) => void;
}

export function QuickReactions({ post, onReact }: QuickReactionsProps) {
  const total = Object.values(post.reactions).reduce((a, b) => a + b, 0);

  return (
    <div className="flex items-center gap-1 flex-wrap mt-2 -ml-1">
      {REACTION_EMOJIS.map(({ key, char }) => {
        const count = post.reactions[key];
        const active = post.myReaction === key;
        return (
          <button
            key={key}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onReact(post.id, key);
            }}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all btn-press",
              active
                ? "bg-gambas-accent/25 ring-1 ring-gambas-accent/50 scale-105"
                : "hover:bg-gambas-card text-gambas-muted hover:scale-105"
            )}
            aria-label={`Reacción ${char}`}
          >
            <span>{char}</span>
            {count > 0 && (
              <span className="text-xs font-medium tabular-nums">{count}</span>
            )}
          </button>
        );
      })}
      {total > 0 && (
        <span className="text-xs text-gambas-muted ml-1">{total} reacciones</span>
      )}
    </div>
  );
}

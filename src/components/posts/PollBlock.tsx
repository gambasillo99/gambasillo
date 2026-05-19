"use client";

import type { Poll, PostWithAuthor } from "@/types";
import { cn } from "@/lib/utils";

interface PollBlockProps {
  poll: Poll;
  postId: string;
  myVote?: string | null;
  onVote: (postId: string, optionId: string) => void;
}

export function PollBlock({ poll, postId, myVote, onVote }: PollBlockProps) {
  const total = poll.options.reduce((s, o) => s + o.votes, 0);

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-gambas-border/40 p-3 bg-gambas-surface/50">
      {poll.options.map((opt) => {
        const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
        const voted = myVote === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={Boolean(myVote)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!myVote) onVote(postId, opt.id);
            }}
            className={cn(
              "relative w-full text-left rounded-lg overflow-hidden border transition-colors",
              voted
                ? "border-gambas-accent/60"
                : "border-gambas-border/30 hover:border-gambas-accent/40",
              myVote && !voted && "opacity-70"
            )}
          >
            {total > 0 && (
              <div
                className="absolute inset-y-0 left-0 bg-gambas-accent/15 transition-all"
                style={{ width: `${pct}%` }}
              />
            )}
            <div className="relative flex justify-between items-center px-3 py-2 text-sm">
              <span className="font-medium">{opt.text}</span>
              <span className="text-gambas-muted text-xs tabular-nums">
                {total > 0 ? `${pct}%` : "—"}
              </span>
            </div>
          </button>
        );
      })}
      <p className="text-xs text-gambas-muted">{total} votos en la encuesta</p>
    </div>
  );
}

export function PollBlockFromPost({
  post,
  onVote,
}: {
  post: PostWithAuthor;
  onVote: (postId: string, optionId: string) => void;
}) {
  if (!post.poll) return null;
  return (
    <PollBlock
      poll={post.poll}
      postId={post.id}
      myVote={post.myPollVoteOptionId}
      onVote={onVote}
    />
  );
}

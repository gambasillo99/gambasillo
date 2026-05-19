"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { CommentWithAuthor } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { formatUsername } from "@/lib/utils";
import Link from "next/link";
import { copy } from "@/lib/gambas-copy";

interface CommentThreadProps {
  comments: CommentWithAuthor[];
  onReply: (content: string, parentId: string | null) => void;
  currentUserId?: string;
}

export function CommentThread({
  comments,
  onReply,
  currentUserId,
}: CommentThreadProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const handleSubmit = (parentId: string | null) => {
    if (!replyText.trim()) return;
    onReply(replyText.trim(), parentId);
    setReplyText("");
    setReplyingTo(null);
  };

  return (
    <div className="divide-y divide-gambas-border/30">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          depth={0}
          replyingTo={replyingTo}
          replyText={replyText}
          onSetReplyingTo={setReplyingTo}
          onSetReplyText={setReplyText}
          onSubmit={handleSubmit}
          currentUserId={currentUserId}
        />
      ))}
      {comments.length === 0 && (
        <p className="text-gambas-muted text-sm text-center py-8">
          {copy.commentsEmpty}
        </p>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  depth,
  replyingTo,
  replyText,
  onSetReplyingTo,
  onSetReplyText,
  onSubmit,
  currentUserId,
}: {
  comment: CommentWithAuthor;
  depth: number;
  replyingTo: string | null;
  replyText: string;
  onSetReplyingTo: (id: string | null) => void;
  onSetReplyText: (text: string) => void;
  onSubmit: (parentId: string | null) => void;
  currentUserId?: string;
}) {
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale: es,
  });
  const isReplying = replyingTo === comment.id;
  const maxDepth = 3;

  return (
    <div
      className="py-3 animate-fade-in"
      style={{ paddingLeft: depth > 0 ? `${Math.min(depth, maxDepth) * 1.25}rem` : 0 }}
    >
      <div className="flex gap-2">
        <Avatar
          username={comment.author.username}
          displayName={comment.author.displayName}
          avatarUrl={comment.author.avatarUrl}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <Link
              href={`/profile/${comment.author.username}`}
              className="font-semibold hover:underline"
            >
              {comment.author.displayName}
            </Link>
            <span className="text-gambas-muted">
              {formatUsername(comment.author.username)}
            </span>
            <span className="text-gambas-muted">· {timeAgo}</span>
          </div>
          <p className="text-gambas-text text-sm mt-0.5 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
          {currentUserId && depth < maxDepth && (
            <button
              type="button"
              onClick={() => onSetReplyingTo(isReplying ? null : comment.id)}
              className="text-gambas-muted text-xs mt-1 hover:text-gambas-accent transition-colors"
            >
              Chirlar de vuelta
            </button>
          )}
          {isReplying && (
            <div className="mt-2 flex gap-2">
              <input
                value={replyText}
                onChange={(e) => onSetReplyText(e.target.value)}
                placeholder={copy.replyPlaceholder}
                className="flex-1 text-sm bg-gambas-surface border border-gambas-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gambas-accent/40"
                onKeyDown={(e) => e.key === "Enter" && onSubmit(comment.id)}
                autoFocus
              />
              <Button size="sm" onClick={() => onSubmit(comment.id)}>
                {copy.enviarChirla}
              </Button>
            </div>
          )}
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-1 border-l border-gambas-border/30 ml-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              replyingTo={replyingTo}
              replyText={replyText}
              onSetReplyingTo={onSetReplyingTo}
              onSetReplyText={onSetReplyText}
              onSubmit={onSubmit}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
